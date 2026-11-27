// Simple per-IP rate limit, in memory (one server process). No extra package needed.
//   router.get(path, rateLimit({ max: 30, windowMs: 60_000, name: "walking-route" }), handler)
// Over the limit: 429 { error } and a Retry-After header (seconds).
// Behind a proxy (Render, nginx), set app.set("trust proxy", 1) so req.ip is the visitor's IP.
export function rateLimit({ max, windowMs, name }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Forget old windows now and then, so the map can't grow forever
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
  }, windowMs);
  sweep.unref?.(); // don't keep the process (or tests) alive

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip ?? "unknown";
    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res
        .status(429)
        .json({ error: `Too many requests${name ? ` (${name})` : ""}. Please wait a minute.` });
    }
    next();
  };
}
