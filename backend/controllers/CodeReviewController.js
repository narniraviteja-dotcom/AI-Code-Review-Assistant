const CodeReview = require("../models/CodeReview");

// Upload Code
const uploadCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required",
      });
    }

    const newReview = await CodeReview.create({
      language,
      code,
    });

    res.status(201).json({
      message: "Code uploaded successfully",
      data: newReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get Upload History
const getHistory = async (req, res) => {
  try {
    const reviews = await CodeReview.find().sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Dashboard Statistics
const getStats = async (req, res) => {
  try {
    const totalReviews = await CodeReview.countDocuments();

    const result = await CodeReview.aggregate([
      {
        $group: {
          _id: null,
          totalBugs: { $sum: "$bugs" },
          totalSuggestions: { $sum: "$suggestions" },
        },
      },
    ]);

    res.status(200).json({
      totalReviews,
      bugsFound: result.length > 0 ? result[0].totalBugs : 0,
      suggestions: result.length > 0 ? result[0].totalSuggestions : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  uploadCode,
  getHistory,
  getStats,
};