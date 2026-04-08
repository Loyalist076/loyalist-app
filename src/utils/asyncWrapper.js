/**
 * Async wrapper to eliminate try-catch blocks in controllers
 * Catches errors and passes them to the global error handler
 * @module asyncWrapper
 */

/**
 * Wraps an async route handler to catch errors automatically
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 * @example
 * router.get('/', asyncWrapper(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;
