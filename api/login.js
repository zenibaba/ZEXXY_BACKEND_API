/**
 * API Endpoint: /api/login
 * User login with credentials and HWID validation
 */

const { fetchDB } = require('../lib/github-db');

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
        const { username, password, hwid } = req.body;

        // Validate input
        if (!username || !password || !hwid) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Fetch database
        const { db } = await fetchDB();
        if (!db) {
            return res.status(500).json({ success: false, message: 'Database not found' });
        }

        // Find user
        const user = db.users?.find(u => u.username === username);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify password
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Check if user is banned
        if (user.status === 'BANNED') {
            return res.status(403).json({ success: false, message: 'Account is banned' });
        }

        // Check HWID
        if (user.hwid !== 'RESET' && user.hwid !== hwid) {
            return res.status(403).json({
                success: false,
                message: 'HWID mismatch - device not authorized'
            });
        }

        // Check expiry
        const currentTime = Math.floor(Date.now() / 1000);
        if (user.expiry !== 9999999999999 && user.expiry < currentTime) {
            return res.status(403).json({ success: false, message: 'Subscription expired' });
        }

        // Success
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                username: user.username,
                rank: user.rank,
                expiry: user.expiry,
                status: user.status,
                hwid: user.hwid
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
