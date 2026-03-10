const config = require('../config/config');

/**
 * Resolve the actual Cursor token from the request.
 *
 * Logic:
 * 1. If AUTH_TOKEN is set and the client's key matches AUTH_TOKEN,
 *    use CURSOR_COOKIE as the actual token.
 * 2. If AUTH_TOKEN is not set, use the client's key directly as the token.
 * 3. If CURSOR_COOKIE is set but AUTH_TOKEN is not,
 *    any request will use CURSOR_COOKIE.
 */
function resolveToken(req) {
  // Extract token from x-api-key or Authorization header
  let clientKey = req.headers['x-api-key'] || '';
  if (!clientKey) {
    clientKey = req.headers.authorization?.replace('Bearer ', '') || '';
  }

  if (!clientKey && !config.cursorCookie) {
    return null;
  }

  // If AUTH_TOKEN is configured, validate the client key
  if (config.authToken) {
    if (clientKey === config.authToken) {
      return config.cursorCookie || clientKey;
    }
  }

  // If CURSOR_COOKIE is set and client sends no key
  if (config.cursorCookie && !clientKey) {
    return config.cursorCookie;
  }

  // Use client-provided key directly (original behavior)
  return clientKey;
}

/**
 * Extract and normalize the cursor auth token (handle :: format)
 */
function normalizeCursorToken(token) {
  if (!token) return '';
  const keys = token.split(',').map(k => k.trim());
  let authToken = keys[Math.floor(Math.random() * keys.length)];
  if (authToken && authToken.includes('%3A%3A')) {
    authToken = authToken.split('%3A%3A')[1];
  } else if (authToken && authToken.includes('::')) {
    authToken = authToken.split('::')[1];
  }
  return authToken;
}

module.exports = { resolveToken, normalizeCursorToken };
