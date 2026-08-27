const fs = require('fs');
const path = require('path');
const decoderEngine = require('../decoder/engine');

function printStatus() {
    console.log('=== HDFilmCehennemi Stremio Addon Status ===\n');

    // Check decoder profile
    const profile = decoderEngine.loadProfile();
    console.log('Decoder Profile: ' + (profile ? 'OK (Dynamic)' : 'Legacy / Hardcoded'));
    if (profile) {
        console.log(`Last Decoder Change: ${profile.detectedAt}`);
        console.log(`Current Decoder Pipeline: ${profile.pipeline.join(' -> ')}`);
        console.log(`Unmix Constant: ${profile.unmixConstant}, Offset: ${profile.unmixOffset}`);
    }

    // Check failures
    const failuresDir = path.join(__dirname, '..', 'runtime', 'failures');
    if (fs.existsSync(failuresDir)) {
        const failures = fs.readdirSync(failuresDir);
        console.log(`Total Failure Snapshots: ${failures.length}`);
        if (failures.length > 0) {
            console.log(`Latest Failure: ${failures[failures.length - 1]}`);
        }
    } else {
        console.log('Total Failure Snapshots: 0');
    }

    console.log('\nUse "npm run healthcheck" for active testing.');
}

printStatus();
