/**
 * Lightweight error class for intentional, status-coded failures
 * (e.g. "404 trip not found", "403 not your trip"). Caught by the
 * central errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
