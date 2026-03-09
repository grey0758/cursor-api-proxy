module.exports = {
    port: process.env.PORT || 3010,
    proxy:{
        enabled: !!process.env.PROXY_URL,
        url: process.env.PROXY_URL || 'http://127.0.0.1:7890',
    },
    // Custom API key for client authentication (optional)
    // If set, clients use this key instead of the raw Cursor cookie
    authToken: process.env.AUTH_TOKEN || '',
    // Cursor cookie (JWT) for backend API calls
    // If set, the proxy uses this internally so clients don't need the raw cookie
    cursorCookie: process.env.CURSOR_COOKIE || '',
};
