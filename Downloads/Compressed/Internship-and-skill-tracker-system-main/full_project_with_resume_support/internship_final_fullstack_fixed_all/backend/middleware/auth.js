// middleware/auth.js
const jwt = require('jsonwebtoken');


function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.toString().split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_your_secret');

    // Normalize common fields into id and role
    const id = payload.id || payload.userId || payload._id || payload.sub;
    const role = payload.role || payload.userRole || payload.roleName || null;

    // Always provide both id and userId for compatibility
    req.user = {
      id: id || null,
      userId: id || null,
      role: role
    };

    return next();
  } catch (err) {
    console.error('authenticateJWT error:', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * authorizeRoles(...allowed)
 * Usage: authorizeRoles('admin','company')
 */
function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * optionalAuthenticateJWT:
 * - if Authorization header present, verify token and set req.user
 * - if missing or invalid, simply continue without failing (public route)
 */
function optionalAuthenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
    // no token -> continue as unauthenticated
    return next();
  }
  const token = authHeader.toString().split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_your_secret');
    const id = payload.id || payload.userId || payload._id || payload.sub;
    const role = payload.role || payload.userRole || payload.roleName || null;
    req.user = { id: id || null, userId: id || null, role };
    return next();
  } catch (err) {
    // invalid token -> ignore and continue as unauthenticated
    console.warn('optionalAuthenticateJWT: invalid token — continuing unauthenticated');
    return next();
  }
}

module.exports = { authenticateJWT, authorizeRoles, optionalAuthenticateJWT };
