/**
 * API Endpoint: /api/sync-stats
 * Sync user generation stats and rarity IDs from the app
 */

const { fetchDB, pushDB, getTimestamp } = require('../lib/github-db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { username, hwid, stats, rarity_ids } = req.body;

        // Validate input
        if (!username || !hwid) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (username, hwid)'
            });
        }

        // Fetch database
        const { db, sha } = await fetchDB();
        if (!db) {
            return res.status(500).json({ success: false, message: 'Database not found' });
        }

        // Find user
        const userIndex = db.users?.findIndex(u => u.username === username);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = db.users[userIndex];

        // Verify HWID matches (security)
        if (user.hwid !== 'RESET' && user.hwid !== hwid) {
            return res.status(403).json({
                success: false,
                message: 'HWID mismatch'
            });
        }

        // Update stats
        if (stats) {
            // Initialize stats if not exists
            if (!user.stats) {
                user.stats = {
                    generated: 0,
                    success: 0,
                    failed: 0,
                    last_sync: null
                };
            }

            // Increment stats (adding new values to existing)
            user.stats.generated = (user.stats.generated || 0) + (stats.generated || 0);
            user.stats.success = (user.stats.success || 0) + (stats.success || 0);
            user.stats.failed = (user.stats.failed || 0) + (stats.failed || 0);
            user.stats.last_sync = getTimestamp();
        }

        // Add rarity IDs (append to existing list)
        if (rarity_ids && Array.isArray(rarity_ids) && rarity_ids.length > 0) {
            if (!user.rarity_ids) {
                user.rarity_ids = [];
            }

            // Add new rarity IDs
            rarity_ids.forEach(r => {
                // Only add if it doesn't already exist (by id)
                if (!user.rarity_ids.find(existing => existing.id === r.id)) {
                    user.rarity_ids.push({
                        id: r.id,
                        score: r.score,
                        synced_at: getTimestamp()
                    });
                }
            });

            // Keep only last 100 rarity IDs to prevent bloat
            if (user.rarity_ids.length > 100) {
                user.rarity_ids = user.rarity_ids.slice(-100);
            }
        }

        // Update user in database
        db.users[userIndex] = user;

        // Push to GitHub
        const pushed = await pushDB(db, sha, `[SYNC] Stats: ${username}`);
        if (!pushed) {
            return res.status(500).json({ success: false, message: 'Failed to sync stats' });
        }

        return res.status(200).json({
            success: true,
            message: 'Stats synced successfully',
            stats: user.stats
        });

    } catch (error) {
        console.error('Sync stats error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
