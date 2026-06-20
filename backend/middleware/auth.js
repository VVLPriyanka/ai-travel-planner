const jwt = require('jsonwebtoken');

/**
 * Protects routes by requiring a valid JWT in the Authorization header.
 * On success, attaches { id } to req.user so downstream controllers can
 * scope every database query to the authenticated user — this is the
 * single choke point that enforces data isolation between users.
 */
function requireAuth(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Access denied. Missing or malformed auth token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

module.exports = { requireAuth };
