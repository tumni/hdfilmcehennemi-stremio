const fs = require('fs');
const path = require('path');
const { analyzeDecoder } = require('./analyzer');
const { createLogger } = require('../logger');

const log = createLogger('DecoderEngine');
const RUNTIME_DIR = path.join(__dirname, '..', 'runtime');
const PROFILE_PATH = path.join(RUNTIME_DIR, 'decoder-profile.json');
const CANDIDATE_PATH = path.join(RUNTIME_DIR, 'decoder-profile.candidate.json');
const PREVIOUS_PATH = path.join(RUNTIME_DIR, 'decoder-profile.previous.json');
const FAILURES_DIR = path.join(RUNTIME_DIR, 'failures');

// Ensure runtime dirs exist
if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
if (!fs.existsSync(FAILURES_DIR)) fs.mkdirSync(FAILURES_DIR, { recursive: true });

function loadProfile() {
    try {
        if (fs.existsSync(PROFILE_PATH)) {
            return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
        }
    } catch (e) {
        log.error(`Failed to load decoder profile: ${e.message}`);
    }
    return null;
}

function saveProfile(profile, path = PROFILE_PATH) {
    try {
        fs.writeFileSync(path, JSON.stringify(profile, null, 2));
        log.info(`Profile saved to ${path}`);
    } catch (e) {
        log.error(`Failed to save profile: ${e.message}`);
    }
}

function activateCandidate() {
    try {
        if (fs.existsSync(PROFILE_PATH)) {
            fs.copyFileSync(PROFILE_PATH, PREVIOUS_PATH);
        }
        fs.renameSync(CANDIDATE_PATH, PROFILE_PATH);
        log.info('Candidate profile activated successfully.');
        return true;
    } catch (e) {
        log.error(`Failed to activate candidate profile: ${e.message}`);
        return false;
    }
}

function rollbackProfile() {
    try {
        if (fs.existsSync(PREVIOUS_PATH)) {
            fs.copyFileSync(PREVIOUS_PATH, PROFILE_PATH);
            log.info('Rolled back to previous profile.');
            return true;
        }
    } catch (e) {
        log.error(`Failed to rollback profile: ${e.message}`);
    }
    return false;
}

function executePipeline(value, profile) {
    let result = value;
    for (const op of profile.pipeline) {
        if (op === 'BASE64_DECODE') {
            try {
                result = Buffer.from(result, 'base64').toString('latin1');
            } catch (e) {
                log.warn(`Base64 decode failed: ${e.message}`);
            }
        } else if (op === 'REVERSE') {
            result = result.split('').reverse().join('');
        } else if (op === 'ROT13') {
            result = result.replace(/[a-zA-Z]/g, function (c) {
                return String.fromCharCode(
                    (c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
                );
            });
        } else if (op === 'CHARCODE_UNMIX') {
            let unmix = '';
            const constant = profile.unmixConstant || 399756995;
            const offset = profile.unmixOffset !== undefined ? profile.unmixOffset : 5;
            for (let i = 0; i < result.length; i++) {
                let charCode = result.charCodeAt(i);
                charCode = (charCode - (constant % (i + offset)) + 256) % 256;
                unmix += String.fromCharCode(charCode);
            }
            result = unmix;
        }
    }
    return result;
}

function createFailureSnapshot(metadata, unpackedJs, errorMsg) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapDir = path.join(FAILURES_DIR, timestamp);
    fs.mkdirSync(snapDir, { recursive: true });
    
    fs.writeFileSync(path.join(snapDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    if (unpackedJs) fs.writeFileSync(path.join(snapDir, 'decoder-fragment.js.txt'), unpackedJs);
    if (errorMsg) fs.writeFileSync(path.join(snapDir, 'error.txt'), errorMsg);
    
    // Clean up old snapshots (keep last 10)
    const snapshots = fs.readdirSync(FAILURES_DIR)
        .map(name => ({ name, time: fs.statSync(path.join(FAILURES_DIR, name)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
        
    if (snapshots.length > 10) {
        for (let i = 10; i < snapshots.length; i++) {
            fs.rmSync(path.join(FAILURES_DIR, snapshots[i].name), { recursive: true, force: true });
        }
    }
    
    log.info(`Failure snapshot saved to ${snapDir}`);
}

module.exports = {
    loadProfile,
    saveProfile,
    CANDIDATE_PATH,
    activateCandidate,
    rollbackProfile,
    executePipeline,
    createFailureSnapshot,
    analyzeDecoder
};
