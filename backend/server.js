require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/user");
const codeReviewRoutes = require("./routes/codeReview");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// CORS configuration - allow frontend origin
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/reviews", codeReviewRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("AI Code Review Assistant Backend Running");
});

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
