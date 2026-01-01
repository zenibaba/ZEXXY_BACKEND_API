/**
 * API Endpoint: /api/broadcasts
 * Get broadcasts for specific user rank
 */

const { fetchDB } = require('../lib/github-db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { rank } = req.method === 'POST' ? req.body : req.query;

        // Fetch database
        const { db } = await fetchDB();
        if (!db) {
            return res.status(500).json({ success: false, message: 'Database not found' });
        }

        // Get broadcasts
        let broadcasts = db.broadcasts || [];

        // Filter by active
        broadcasts = broadcasts.filter(b => b.active !== false);

        // Filter by target rank if provided
        if (rank) {
            broadcasts = broadcasts.filter(b =>
                b.target === 'ALL' || b.target === rank
            );
        }

        // Sort by created_at (newest first)
        broadcasts.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });

        return res.status(200).json({
            success: true,
            broadcasts,
            count: broadcasts.length
        });

    } catch (error) {
        console.error('Broadcasts error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
