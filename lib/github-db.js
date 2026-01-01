/**
 * GitHub Database Layer
 * Uses GitHub repository as database storage
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'zenibaba';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'ZEXXY_KEYAUTH';
const DB_PATH = 'db.json';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DB_PATH}`;

/**
 * Fetch database from GitHub
 * @returns {Promise<{db: object, sha: string}>}
 */
async function fetchDB() {
    try {
        const response = await fetch(API_BASE, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Database not found (404)');
                return { db: null, sha: null };
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8').trim();

        if (!content) {
            console.log('Database file is empty');
            return { db: null, sha: data.sha };
        }

        const db = JSON.parse(content);
        return { db, sha: data.sha };

    } catch (error) {
        console.error('Error fetching DB:', error);
        throw error;
    }
}

/**
 * Push database to GitHub
 * @param {object} dbContent - Database content
 * @param {string} sha - Current file SHA
 * @param {string} message - Commit message
 * @returns {Promise<boolean>}
 */
async function pushDB(dbContent, sha, message) {
    try {
        const contentStr = JSON.stringify(dbContent, null, 2);
        const contentB64 = Buffer.from(contentStr).toString('base64');

        const payload = {
            message,
            content: contentB64,
            branch: 'main'
        };

        if (sha) {
            payload.sha = sha;
        }

        const response = await fetch(API_BASE, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Push error:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('Error pushing DB:', error);
        return false;
    }
}

/**
 * Calculate expiry timestamp
 * @param {number|string} durationDays - Duration in days or "LIFETIME"
 * @returns {number}
 */
function calculateExpiry(durationDays) {
    if (durationDays === "LIFETIME") {
        return 9999999999999;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const daysInSeconds = parseInt(durationDays) * 24 * 60 * 60;
    return currentTime + daysInSeconds;
}

/**
 * Get current timestamp
 * @returns {string}
 */
function getTimestamp() {
    return new Date().toISOString();
}

module.exports = {
    fetchDB,
    pushDB,
    calculateExpiry,
    getTimestamp
};
