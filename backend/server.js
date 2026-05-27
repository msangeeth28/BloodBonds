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
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://blood-bonds.vercel.app",  
];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS: Origin not allowed — " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.options(/(.*)/,  cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth",         authRoutes);
app.use("/api/donor",        donorRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/admin",        adminRoutes);

app.get("/", (req, res) => res.send("Blood Bonds API Running ❤"));
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
