const express = require("express");
const router = express.Router();

const {
  uploadCode,
  getHistory,
  getStats,
} = require("../controllers/codeReviewController");

// Upload code
router.post("/upload", uploadCode);

// Get upload history
router.get("/history", getHistory);

// Get dashboard statistics
router.get("/stats", getStats);

module.exports = router;