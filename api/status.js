/**
 * API Endpoint: /api/status
 * Get system status and statistics
 */

const { fetchDB } = require('../lib/github-db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // Fetch database
        const { db } = await fetchDB();
        if (!db) {
            return res.status(500).json({ success: false, message: 'Database not found' });
        }

        const users = db.users || [];
        const keys = db.keys || [];
        const broadcasts = db.broadcasts || [];

        const stats = {
            users: {
                total: users.length,
                active: users.filter(u => u.status === 'ACTIVE').length,
                banned: users.filter(u => u.status === 'BANNED').length,
                by_rank: {
                    OWNER: users.filter(u => u.rank === 'OWNER').length,
                    ADMIN: users.filter(u => u.rank === 'ADMIN').length,
                    VIP: users.filter(u => u.rank === 'VIP').length,
                    USER: users.filter(u => u.rank === 'USER').length
                }
            },
            keys: {
                total: keys.length,
                unused: keys.filter(k => k.status === 'UNUSED').length,
                used: keys.filter(k => k.status === 'USED').length,
                banned: keys.filter(k => k.status === 'BANNED').length,
                universal: keys.filter(k => k.universal_hwid).length,
                reusable: keys.filter(k => k.reusable).length
            },
            broadcasts: {
                total: broadcasts.length,
                active: broadcasts.filter(b => b.active !== false).length
            }
        };

        return res.status(200).json({
            success: true,
            stats,
            repository: `${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
