const crypto = require("crypto");

const requestCounts = new Map();

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const key = `${ip}:${req.method}:${req.originalUrl}`;
    const current = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    requestCounts.set(key, current);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(current.resetAt / 1000));

    if (current.count > max) {
      res.status(429);
      return next(new Error(message || "Too many requests. Please try again later."));
    }

    next();
  };
};

setInterval(() => {
  const now = Date.now();

  requestCounts.forEach((value, key) => {
    if (value.resetAt <= now) {
      requestCounts.delete(key);
    }
  });
}, 10 * 60 * 1000).unref();

module.exports = {
  requestId,
  securityHeaders,
  rateLimit
};
