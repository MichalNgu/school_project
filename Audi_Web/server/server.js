require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ==== STATIC PATHS ====
const PUBLIC_PATH = path.join(__dirname, "../Web_project/public");
const IMG_PATH = path.join(__dirname, "../Web_project/img");
const DATA_PATH = path.join(__dirname, "../Web_project/data");

// ==== SECURITY ====
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://www.google.com",
          "https://maps.googleapis.com"
        ],
        "frame-src": [
          "'self'",
          "https://www.google.com",
          "https://www.google.cz"
        ],
        "child-src": [
          "'self'",
          "https://www.google.com",
          "https://www.google.cz"
        ],
        "img-src": ["'self'", "data:", "https:"], // Added for images
        "connect-src": ["'self'", "https://maps.googleapis.com"] // Added for API calls
      }
    },
    frameguard: false
  })
);

// ==== CORS ====
app.use(cors());

// ==== LOGGING ====
app.use(morgan("dev"));

// ==== BODY PARSER ====
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ==== RATE LIMIT ====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ==== STATIC FILES ====
app.use(express.static(PUBLIC_PATH));
app.use("/img", express.static(IMG_PATH));
app.use("/data", express.static(DATA_PATH));

// ==== API ROUTES ====
// Load API routes with error handling
try {
  const apiRoutes = require("./routes/api");
  app.use("/api", apiRoutes);
} catch (error) {
  console.error("⚠️  Warning: Could not load API routes:", error.message);
  // Create a fallback route if api.js doesn't exist
  app.use("/api", (req, res) => {
    res.status(503).json({ 
      error: "API routes not available",
      message: "Please check server configuration"
    });
  });
}

// ==== HEALTH CHECK ====
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==== 404 HANDLER ====
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found",
    path: req.path
  });
});

// ==== ERROR HANDLER ====
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// ==== START SERVER ====
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${PUBLIC_PATH}`);
  console.log(`🖼️  Images path: ${IMG_PATH}`);
  console.log(`📊 Data path: ${DATA_PATH}\n`);
});

// ==== GRACEFUL SHUTDOWN ====
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully...");
  process.exit(0);
});