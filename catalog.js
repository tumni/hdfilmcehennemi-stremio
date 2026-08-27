/**
 * HDFilmCehennemi Stremio Catalog Module
 * 
 * Proxies requests to Cinemeta to provide fast, reliable catalogs
 * without being blocked by HDFilmCehennemi's Cloudflare.
 */

const { fetch } = require('undici');
const { createLogger } = require('./logger');

const log = createLogger('Catalog');

// Base URL for Cinemeta
const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

/**
 * Fetch catalog from Cinemeta
 * @param {string} type - 'movie' or 'series'
 * @param {string} id - Catalog ID (e.g., 'hdfc-popular')
 * @param {Object} extra - Extra parameters (genre, skip, search)
 * @returns {Promise<Object>} Catalog response with metas array
 */
async function getCatalog(type, id, extra = {}) {
    try {
        log.info(`Catalog request: type=${type}, id=${id}, extra=${JSON.stringify(extra)}`);
        
        let path = `/catalog/${type}/top`;
        
        // Build query string for Cinemeta
        const parts = [];
        
        // Search takes precedence if provided
        if (extra.search) {
            path = `/catalog/${type}/top/search=${encodeURIComponent(extra.search)}`;
        } else {
            if (extra.genre) {
                parts.push(`genre=${encodeURIComponent(extra.genre)}`);
            }
            if (extra.skip) {
                parts.push(`skip=${extra.skip}`);
            }
            
            if (parts.length > 0) {
                path += `/${parts.join('&')}`;
            }
        }
        
        path += '.json';
        const targetUrl = `${CINEMETA_URL}${path}`;
        
        log.debug(`Fetching from Cinemeta: ${targetUrl}`);
        
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Cinemeta returned ${response.status}`);
        }
        
        const data = await response.json();
        
        return { metas: data.metas || [] };
    } catch (error) {
        log.error(`Catalog error: ${error.message}`);
        // Return empty catalog on error to prevent Stremio from crashing
        return { metas: [] };
    }
}

module.exports = {
    getCatalog
};
