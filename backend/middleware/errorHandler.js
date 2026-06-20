/**
 * Centralized error handler. Controllers call next(err) (or asyncHandler
 * forwards thrown errors here automatically) instead of each one writing
 * its own try/catch response logic.
 */
function errorHandler(err, req, res, _next) {
  console.error('[error]', err.message);

  // Mongoose validation errors -> 400 with field-level messages
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', details });
  }

  // Mongoose duplicate key (e.g. email already registered) -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  // Invalid ObjectId cast -> 400
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier supplied.' });
  }

  const status = err.statusCode || 500;
  const message =
    status === 500 ? 'Something went wrong on our end. Please try again.' : err.message;

  res.status(status).json({ message });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
