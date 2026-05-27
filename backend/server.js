const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes         = require("./routes/authRoutes");
const donorRoutes        = require("./routes/donorRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const adminRoutes        = require("./routes/adminRoutes");

connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow requests from the Vite dev server and any localhost port.
// In production replace the origins array with your actual domain.
app.use(cors({
  origin: [
    `${process.env.PORT}`
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight OPTIONS requests for every route
// Express 5 dropped bare "*" wildcard — must use a regex
app.options(/(.*)/,  cors());

// ── BODY PARSER ───────────────────────────────────────────────────────────────
// Raised to 10mb to support base64-encoded profile image uploads.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/donor",        donorRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/admin",        adminRoutes);

app.get("/", (req, res) => res.send("Blood Bonds API Running ❤"));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
