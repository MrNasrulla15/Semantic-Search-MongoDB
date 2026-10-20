const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const searchRoutes = require("./routes/search");
const embeddingService = require("./services/embeddingService");

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Only allow requests from explicitly configured origins.
// Set CORS_ORIGIN in .env — comma-separated for multiple origins.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));

// ── Dependency injection ──────────────────────────────────────────────────────
// Attach services to app.locals so routes and tests can access/replace them.
app.locals.embeddingService = embeddingService;

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", searchRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
// In production, never send internal error details to the client.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error);
  const isProduction = process.env.NODE_ENV === "production";
  res.status(error.status || 500).json({
    message: isProduction ? "Internal server error" : (error.message || "Internal server error")
  });
});

module.exports = app;
