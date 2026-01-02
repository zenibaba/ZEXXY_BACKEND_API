/**
 * API Endpoint: /api/analytics
 * Get analytics data for admin dashboard
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

        // Calculate analytics
        const totalUsers = (db.users || []).length;
        const totalKeys = (db.keys || []).length;
        const activeKeys = (db.keys || []).filter(k => k.status === 'UNUSED').length;
        const usedKeys = (db.keys || []).filter(k => k.status === 'USED').length;
        const bannedKeys = (db.keys || []).filter(k => k.status === 'BANNED').length;

        // Calculate total generated from user stats
        let totalGenerated = 0;
        let totalSuccess = 0;
        let totalFailed = 0;

        (db.users || []).forEach(user => {
            if (user.stats) {
                totalGenerated += user.stats.generated || 0;
                totalSuccess += user.stats.success || 0;
                totalFailed += user.stats.failed || 0;
            }
        });

        // Top users by generation count
        const topUsers = (db.users || [])
            .filter(u => u.stats && u.stats.generated > 0)
            .sort((a, b) => (b.stats?.generated || 0) - (a.stats?.generated || 0))
            .slice(0, 10)
            .map(u => ({
                username: u.username,
                rank: u.rank,
                generated: u.stats?.generated || 0,
                success: u.stats?.success || 0,
                failed: u.stats?.failed || 0,
            }));

        // Rarity distribution (from all users' rarity_ids)
        const rarityMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
        (db.users || []).forEach(user => {
            if (user.rarity_ids && Array.isArray(user.rarity_ids)) {
                user.rarity_ids.forEach(r => {
                    const score = Math.min(10, Math.floor(r.score));
                    rarityMap[score] = (rarityMap[score] || 0) + 1;
                });
            }
        });

        const rarityStats = [
            { rarity: 'Common (0-2)', count: (rarityMap[0] || 0) + (rarityMap[1] || 0) + (rarityMap[2] || 0), color: '#64748b' },
            { rarity: 'Rare (3-5)', count: (rarityMap[3] || 0) + (rarityMap[4] || 0) + (rarityMap[5] || 0), color: '#3b82f6' },
            { rarity: 'Epic (6-8)', count: (rarityMap[6] || 0) + (rarityMap[7] || 0) + (rarityMap[8] || 0), color: '#a855f7' },
            { rarity: 'Legendary (9+)', count: (rarityMap[9] || 0) + (rarityMap[10] || 0), color: '#f59e0b' },
        ];

        // User rank distribution
        const rankMap = {};
        (db.users || []).forEach(user => {
            rankMap[user.rank] = (rankMap[user.rank] || 0) + 1;
        });

        return res.status(200).json({
            success: true,
            analytics: {
                overview: {
                    totalUsers,
                    totalKeys,
                    activeKeys,
                    usedKeys,
                    bannedKeys,
                    totalGenerated,
                    totalSuccess,
                    totalFailed,
                },
                topUsers,
                rarityStats,
                rankDistribution: rankMap,
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
