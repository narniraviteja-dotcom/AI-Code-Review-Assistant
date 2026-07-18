const CodeReview = require("../models/CodeReview");
const ai = require("../config/gemini");

// Upload Code and Generate AI Review
const uploadCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required",
      });
    }

    const prompt = `
Review the following ${language} code.

Give:
1. Bugs found
2. Suggestions
3. Detailed explanation

Code:
${code}
`;

    let review = "AI review unavailable at the moment. Please try again later.";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      review = response.text || review;
    } catch (geminiError) {
      console.error("Gemini review generation failed:", geminiError);
    }

    const newReview = await CodeReview.create({
      language,
      code,
      review,
      bugs: 0,
      suggestions: 0,
    });

    res.status(201).json({
      message: "Code reviewed successfully",
      data: newReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get History
const getHistory = async (req, res) => {
  try {
    const reviews = await CodeReview.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Dashboard Stats
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

    res.json({
      totalReviews,
      bugsFound: result.length ? result[0].totalBugs : 0,
      suggestions: result.length ? result[0].totalSuggestions : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  uploadCode,
  getHistory,
  getStats,
};