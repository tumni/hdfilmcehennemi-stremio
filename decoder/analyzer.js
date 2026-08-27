const acorn = require('acorn');
const walk = require('acorn-walk');
const { createLogger } = require('../logger');

const log = createLogger('DecoderAnalyzer');

/**
 * Analyzes unpacked JavaScript to determine the decoding pipeline.
 * @param {string} jsCode - The unpacked JavaScript code
 * @returns {Object} Extracted pipeline and constants
 */
function analyzeDecoder(jsCode) {
    log.info('Analyzing JS AST for decoder pipeline...');
    let ast;
    try {
        ast = acorn.parse(jsCode, { ecmaVersion: 2020 });
    } catch (e) {
        log.error(`Failed to parse JS: ${e.message}`);
        return null;
    }

    const pipeline = [];
    let unmixConstant = null;
    let unmixOffset = null;

    // A simple heuristic-based walk
    walk.simple(ast, {
        CallExpression(node) {
            // Detect atob()
            if (node.callee.type === 'Identifier' && node.callee.name === 'atob') {
                if (!pipeline.includes('BASE64_DECODE')) {
                    pipeline.push('BASE64_DECODE');
                }
            }
            
            // Detect reverse()
            if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'reverse') {
                if (!pipeline.includes('REVERSE')) {
                    pipeline.push('REVERSE');
                }
            }

            // Detect join()
            if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'join') {
                if (!pipeline.includes('JOIN')) {
                    pipeline.push('JOIN');
                }
            }

            // Detect split()
            if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'split') {
                if (!pipeline.includes('SPLIT')) {
                    pipeline.push('SPLIT');
                }
            }

            // Detect rot13 (usually implemented with replace and a regex /[a-zA-Z]/)
            if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'replace') {
                const arg1 = node.arguments[0];
                if (arg1 && arg1.type === 'Literal' && arg1.regex) {
                    if (arg1.regex.pattern.includes('a-z') || arg1.regex.pattern.includes('a-zA-Z')) {
                        if (!pipeline.includes('ROT13')) {
                            pipeline.push('ROT13');
                        }
                    }
                }
            }
            
            // Detect String.fromCharCode
            if (node.callee.type === 'MemberExpression' && 
                node.callee.object.name === 'String' && 
                node.callee.property.name === 'fromCharCode') {
                if (!pipeline.includes('CHARCODE_UNMIX')) {
                    pipeline.push('CHARCODE_UNMIX');
                }
            }
        },
        BinaryExpression(node) {
            // Detect magic constant in charCode logic: e.g. 399756995 % (i + 5)
            // It could be a modulo operation
            if (node.operator === '%') {
                if (node.left.type === 'Literal' && typeof node.left.value === 'number') {
                    if (node.left.value > 1000) { // Large numeric constant
                        unmixConstant = node.left.value;
                        if (node.right.type === 'BinaryExpression' && node.right.operator === '+') {
                            if (node.right.right.type === 'Literal') {
                                unmixOffset = node.right.right.value;
                            }
                        }
                    }
                }
            }
        }
    });

    log.info(`Analysis complete. Found operations: ${pipeline.join(', ')}`);
    if (unmixConstant) {
        log.info(`Found unmix constant: ${unmixConstant}, offset: ${unmixOffset}`);
    }

    // Attempt to reconstruct the exact order if possible.
    // In AST it's tricky to find exact execution order without full data flow analysis,
    // so if we can't be sure, we can return the operations found.
    // But since the assignment usually happens in sequence, let's walk through assignments/declarations.
    
    // Better order analysis: find all assignments and follow variable modifications
    const orderedPipeline = [];
    walk.simple(ast, {
        AssignmentExpression(node) {
            detectOperationInNode(node.right, orderedPipeline);
        },
        VariableDeclarator(node) {
            if (node.init) {
                detectOperationInNode(node.init, orderedPipeline);
            }
        },
        ReturnStatement(node) {
            if (node.argument) {
                detectOperationInNode(node.argument, orderedPipeline);
            }
        }
    });

    // Extract unique ordered pipeline
    const finalPipeline = [...new Set(orderedPipeline)];
    
    return {
        pipeline: finalPipeline.length > 0 ? finalPipeline : pipeline,
        unmixConstant: unmixConstant || 399756995, // Fallback
        unmixOffset: unmixOffset !== null ? unmixOffset : 5
    };
}

function detectOperationInNode(node, pipeline) {
    if (!node) return;
    
    if (node.type === 'CallExpression') {
        if (node.callee.type === 'Identifier' && node.callee.name === 'atob') {
            pipeline.push('BASE64_DECODE');
        }
        if (node.callee.type === 'MemberExpression') {
            if (node.callee.property.name === 'reverse') pipeline.push('REVERSE');
            if (node.callee.property.name === 'replace') pipeline.push('ROT13');
            if (node.callee.object.name === 'String' && node.callee.property.name === 'fromCharCode') pipeline.push('CHARCODE_UNMIX');
        }
        // Check arguments too
        for (const arg of node.arguments) {
            detectOperationInNode(arg, pipeline);
        }
        if (node.callee.object) {
            detectOperationInNode(node.callee.object, pipeline);
        }
    } else if (node.type === 'BinaryExpression') {
        detectOperationInNode(node.left, pipeline);
        detectOperationInNode(node.right, pipeline);
    }
}

module.exports = {
    analyzeDecoder
};
