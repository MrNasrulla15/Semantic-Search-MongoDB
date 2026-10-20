const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for the /api/search endpoint.
 * Allows up to 30 searches per minute per IP — enough for interactive use
 * while preventing quota exhaustion on the Gemini embedding API.
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many search requests. Please wait a moment and try again." }
});

/**
 * Rate limiter for the /api/ingest endpoint.
 * Ingest calls trigger multiple Gemini API calls, so this is more restrictive.
 */
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many ingest requests. Please wait before inserting more documents." }
});

module.exports = { searchLimiter, ingestLimiter };
