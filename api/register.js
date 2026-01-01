/**
 * API Endpoint: /api/register
 * Register new user with activation key
 */

const { fetchDB, pushDB, calculateExpiry, getTimestamp } = require('../lib/github-db');

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
        const { username, password, key, hwid } = req.body;

        // Validate input
        if (!username || !password || !key || !hwid) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Fetch database
        const { db, sha } = await fetchDB();
        if (!db) {
            return res.status(500).json({ success: false, message: 'Database not found' });
        }

        // Find the key
        const keyObj = db.keys?.find(k => k.key === key);
        if (!keyObj) {
            return res.status(404).json({ success: false, message: 'Invalid key' });
        }

        // Check if key is banned
        if (keyObj.status === 'BANNED') {
            return res.status(403).json({ success: false, message: 'Key is banned' });
        }

        // Check if reusable - if not, must be UNUSED
        const isReusable = keyObj.reusable || false;
        if (!isReusable && keyObj.status !== 'UNUSED') {
            return res.status(400).json({
                success: false,
                message: `Key already ${keyObj.status.toLowerCase()}`
            });
        }

        // Check if username exists
        if (db.users?.some(u => u.username === username)) {
            return res.status(409).json({ success: false, message: 'Username already exists' });
        }

        // Calculate expiry
        const expiry = calculateExpiry(keyObj.duration_days);

        // Determine HWID based on universal_hwid flag
        const isUniversalHwid = keyObj.universal_hwid || false;
        const finalHwid = isUniversalHwid ? 'RESET' : hwid;

        // Create user
        const userObj = {
            username,
            password, // TODO: Hash in production!
            hwid: finalHwid,
            expiry,
            rank: keyObj.type || 'USER',
            status: 'ACTIVE',
            activated_at: getTimestamp(),
            activated_with_key: key
        };

        if (!db.users) db.users = [];
        db.users.push(userObj);

        // Update key status
        if (!isReusable) {
            keyObj.status = 'USED';
            keyObj.used_by = username;
            keyObj.used_at = getTimestamp();
        } else {
            // Track usage for reusable keys
            if (!keyObj.usage_count) keyObj.usage_count = 0;
            keyObj.usage_count++;
            if (!keyObj.used_by_list) keyObj.used_by_list = [];
            keyObj.used_by_list.push({
                username,
                activated_at: getTimestamp()
            });
        }

        // Save to GitHub
        const saved = await pushDB(db, sha, `🎫 User ${username} registered`);
        if (!saved) {
            return res.status(500).json({ success: false, message: 'Failed to save' });
        }

        return res.status(200).json({
            success: true,
            message: 'Account activated successfully',
            user: {
                username: userObj.username,
                rank: userObj.rank,
                expiry: userObj.expiry,
                hwid: finalHwid
            },
            is_universal_hwid: isUniversalHwid,
            is_reusable: isReusable
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
