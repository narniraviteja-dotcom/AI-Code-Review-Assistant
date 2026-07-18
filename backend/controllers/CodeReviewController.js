const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const CodeReview = require("../models/CodeReview");
const ai = require("../config/gemini");

const runStaticAnalysis = (language, code) => {
  const normalizedLanguage = (language || "").toLowerCase();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-review-"));
  const fileName = normalizedLanguage === "python" ? "sample.py" : "sample.js";
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, code, "utf8");

  try {
    if (normalizedLanguage === "python") {
      const output = execFileSync(
        "C:/Users/Adarsh/AppData/Local/Programs/Python/Python312/python.exe",
        ["-m", "pylint", filePath, "--score=n", "--reports=n"],
        { encoding: "utf8", timeout: 60000 }
      );
      return {
        tool: "pylint",
        summary: output.trim() || "No issues found",
        issues: output.trim() ? output.trim().split(/\n+/).filter(Boolean) : [],
      };
    }

    const output = execFileSync(
      "npx",
      ["eslint", filePath, "--no-eslintrc", "--parser-options", "{\"ecmaVersion\":2020\"}", "--rule", "semi: error", "--rule", "no-unused-vars: error"],
      { encoding: "utf8", timeout: 60000 }
    );
    return {
      tool: "eslint",
      summary: output.trim() || "No issues found",
      issues: output.trim() ? output.trim().split(/\n+/).filter(Boolean) : [],
    };
  } catch (error) {
    const stderr = error.stdout ? String(error.stdout) : "";
    const stdout = error.stderr ? String(error.stderr) : "";
    const merged = `${stderr}\n${stdout}`.trim();
    return {
      tool: normalizedLanguage === "python" ? "pylint" : "eslint",
      summary: merged || "Static analysis completed with no output.",
      issues: merged ? merged.split(/\n+/).filter(Boolean) : [],
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

// Upload Code and Generate AI Review
const uploadCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required",
      });
    }

    const staticAnalysis = runStaticAnalysis(language, code);
    const prompt = `
Review the following ${language} code.

Give:
1. Bugs found
2. Suggestions
3. Detailed explanation

Static analysis notes:
${staticAnalysis.summary}

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
      bugs: Math.max(0, staticAnalysis.issues.length),
      suggestions: Math.max(0, staticAnalysis.issues.length > 0 ? 1 : 0),
    });

    res.status(201).json({
      message: "Code reviewed successfully",
      data: {
        ...newReview.toObject(),
        staticAnalysis,
      },
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