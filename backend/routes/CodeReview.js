const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  uploadCode,
  getHistory,
  getStats,
  deleteReview,
} = require("../controllers/codeReviewController");

// Upload code
router.post("/upload", uploadCode);

// Get upload history
router.get("/history", getHistory);

// Get dashboard statistics
router.get("/stats", getStats);

// Delete a review
router.delete("/:id", auth, deleteReview);

module.exports = router;
