const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const CodeReview = require("../models/CodeReview");
const ai = require("../config/gemini");

const getSuggestedFix = (ruleName = "", description = "") => {
  const combined = `${ruleName} ${description}`.toLowerCase();
  if (combined.includes("semi")) {
    return "Add the missing semicolon to the end of the statement.";
  }
  if (combined.includes("no-unused")) {
    return "Remove the unused variable or intentionally mark it as unused.";
  }
  if (combined.includes("no-console")) {
    return "Remove the console statement or replace it with a logger.";
  }
  if (combined.includes("undef")) {
    return "Define the variable before using it.";
  }
  return "Review the flagged line and update the code to satisfy the rule.";
};

const normalizeStaticAnalysis = (tool, output) => {
  const issues = [];
  const rawOutput = String(output || "").trim();
  const lines = rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    let issue = null;
    if (tool === "eslint") {
      const match = line.match(/^(.*?):(\d+):(\d+):\s*(.+?)(?:\s+\[(.+?)\])?$/);
      if (match) {
        const [, filePath, lineNumber, columnNumber, description, ruleName] = match;
        const severity = /error/i.test(description) ? "error" : "warning";
        issue = {
          category: "quality",
          severity,
          ruleName: ruleName || "eslint",
          line: Number(lineNumber),
          column: Number(columnNumber),
          file: filePath || "sample.js",
          description: description.replace(/\s+/g, " ").trim(),
          suggestedFix: getSuggestedFix(ruleName || description, description),
          status: severity === "error" ? "error" : "warning",
        };
      } else if (/error|warning/i.test(line)) {
        issue = {
          category: "quality",
          severity: /error/i.test(line) ? "error" : "warning",
          ruleName: "eslint",
          line: null,
          column: null,
          file: "sample.js",
          description: line,
          suggestedFix: getSuggestedFix("eslint", line),
          status: /error/i.test(line) ? "error" : "warning",
        };
      }
    } else {
      const match = line.match(/^(.*?):(\d+):(\d+):\s*\[(.+?)\]\s*(.+)$/);
      if (match) {
        const [, filePath, lineNumber, columnNumber, ruleCode, description] = match;
        const severity = /error|fatal/i.test(ruleCode) ? "error" : /warning/i.test(ruleCode) ? "warning" : "info";
        issue = {
          category: severity === "error" ? "error" : "warning",
          severity,
          ruleName: ruleCode,
          line: Number(lineNumber),
          column: Number(columnNumber),
          file: filePath || "sample.py",
          description: description.trim(),
          suggestedFix: getSuggestedFix(ruleCode, description),
          status: severity === "error" ? "error" : severity === "warning" ? "warning" : "info",
        };
      } else if (/warning|error|fatal/i.test(line)) {
        issue = {
          category: "quality",
          severity: /error|fatal/i.test(line) ? "error" : "warning",
          ruleName: "pylint",
          line: null,
          column: null,
          file: "sample.py",
          description: line,
          suggestedFix: getSuggestedFix("pylint", line),
          status: /error|fatal/i.test(line) ? "error" : "warning",
        };
      }
    }

    if (issue) {
      issues.push(issue);
    }
  });

  const summary = issues.length
    ? `${issues.length} issue${issues.length > 1 ? "s" : ""} detected`
    : rawOutput || "No issues found";

  return {
    tool,
    summary,
    issues,
  };
};

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
      return normalizeStaticAnalysis("pylint", output);
    }

    const output = execFileSync(
      "npx",
      ["eslint", filePath, "--no-eslintrc", "--parser-options", "{\"ecmaVersion\":2020\"}", "--rule", "semi: error", "--rule", "no-unused-vars: error"],
      { encoding: "utf8", timeout: 60000 }
    );
    return normalizeStaticAnalysis("eslint", output);
  } catch (error) {
    const stderr = error.stdout ? String(error.stdout) : "";
    const stdout = error.stderr ? String(error.stderr) : "";
    const merged = `${stderr}\n${stdout}`.trim();
    return normalizeStaticAnalysis(normalizedLanguage === "python" ? "pylint" : "eslint", merged || "Static analysis completed with no output.");
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
      bugs: Math.max(0, Array.isArray(staticAnalysis.issues) ? staticAnalysis.issues.length : 0),
      suggestions: Math.max(0, Array.isArray(staticAnalysis.issues) && staticAnalysis.issues.length > 0 ? 1 : 0),
      staticAnalysis: {
        tool: staticAnalysis.tool || "",
        summary: staticAnalysis.summary || "No issues found",
        issues: Array.isArray(staticAnalysis.issues) ? staticAnalysis.issues : [],
      },
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

    const reviews = await CodeReview.find({
      staticAnalysis: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean();

    const issueList = reviews.flatMap((review) => {
      const issues = Array.isArray(review.staticAnalysis?.issues) ? review.staticAnalysis.issues : [];
      return issues.map((issue) => ({
        ...issue,
        language: review.language,
        createdAt: review.createdAt,
        reviewId: review._id,
      }));
    });

    const errorsCount = issueList.filter((issue) => (issue.severity || "").toLowerCase() === "error").length;
    const warningsCount = issueList.filter((issue) => (issue.severity || "").toLowerCase() !== "error").length;

    res.json({
      totalReviews,
      bugsFound: result.length ? result[0].totalBugs : 0,
      suggestions: result.length ? result[0].totalSuggestions : 0,
      staticAnalysis: {
        totalIssues: issueList.length,
        errorsCount,
        warningsCount,
        latestTool: reviews[0]?.staticAnalysis?.tool || "None",
        issues: issueList.slice(0, 20),
      },
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