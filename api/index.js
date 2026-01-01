/**
 * API Endpoint: /api/index (root)
 * Welcome message for API root
 */

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.status(200).json({
        success: true,
        message: 'ZEXXY Backend API - GitHub Database',
        version: '1.0.0',
        endpoints: {
            status: '/api/status',
            register: '/api/register (POST)',
            login: '/api/login (POST)',
            broadcasts: '/api/broadcasts (POST)'
        },
        repository: 'https://github.com/zenibaba/ZEXXY_KEYAUTH',
        documentation: 'https://github.com/zenibaba/ZEXXY_BACKEND_API'
    });
};
