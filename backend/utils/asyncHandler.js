/**
 * Wraps an async Express handler so any thrown error / rejected promise
 * is forwarded to next(err) instead of crashing the process or requiring
 * a try/catch in every controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
