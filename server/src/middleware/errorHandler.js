// Catches any error thrown in a route and sends it in the standard shape: { error: "message" }.
// Throw with a status like this:  throw httpError(404, "Listing not found")
// Extra fields go in the third argument: throw httpError(403, "Verify first", { userId: 7 })
export function httpError(status, message, extra) {
  const err = new Error(message);
  err.status = status;
  err.extra = extra;
  return err;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  if (status >= 500) return res.status(status).json({ error: "Something went wrong" });
  res.status(status).json({ error: err.message, ...err.extra });
}
