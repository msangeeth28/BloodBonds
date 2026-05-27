// Wraps async route handlers so Express v5 catches errors properly
// Express v5 supports native async/await but needs this for consistent JSON error responses
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
