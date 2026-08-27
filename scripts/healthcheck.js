const { findContent } = require('../search');
const { getVideoAndSubtitles } = require('../scraper');
const { createLogger } = require('../logger');
const decoderEngine = require('../decoder/engine');

const log = createLogger('Healthcheck');

async function run() {
    log.info('Starting production healthcheck...');
    try {
        // Test 1: Search and find content (Avatar - tt0499549)
        log.info('Step 1: Testing Search (IMDb: tt0499549)');
        const content = await findContent('movie', 'tt0499549');
        if (!content || !content.url) {
            throw new Error('Search failed to return valid content URL.');
        }
        log.info('Search OK.');

        // Test 2: Scrape video
        log.info('Step 2: Testing Scraper and Decoder');
        const result = await getVideoAndSubtitles(content.url);
        
        if (!result || !result.videoUrl) {
            throw new Error('Scraper failed to extract video URL.');
        }
        log.info('Scraper OK.');

        // Check Decoder Profile Status
        const profile = decoderEngine.loadProfile();
        if (profile) {
            log.info(`Active Decoder Profile: ${profile.pipeline.join(' -> ')}`);
        } else {
            log.info('No active decoder profile (using legacy variants).');
        }

        log.info('HEALTHCHECK_OK: System is healthy.');
        process.exit(0);
    } catch (e) {
        log.error(`HEALTHCHECK_FAILED: ${e.message}`);
        process.exit(1);
    }
}

run();
