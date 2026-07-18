const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");
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

const createFallbackAiReview = () => ({
  model: "gemini-2.0-flash",
  summary: "AI review unavailable at the moment. Please try again later.",
  bugs: [],
  codeSmells: [],
  improvements: [],
  complexity: {
    score: 0,
    level: "unknown",
    explanation: "AI review unavailable at the moment.",
  },
  namingSuggestions: [],
  performanceOptimizations: [],
  explanation: "AI explanation unavailable at the moment.",
  documentation: "Documentation unavailable at the moment.",
  refactoring: [],
  status: "fallback",
});

const normalizeAiReview = (rawResponse = "") => {
  const fallback = createFallbackAiReview();
  const trimmed = String(rawResponse || "").trim();

  if (!trimmed) {
    return fallback;
  }

  const sanitized = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = sanitized.indexOf("{");
  const end = sanitized.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? sanitized.slice(start, end + 1) : sanitized;

  try {
    const parsed = JSON.parse(candidate);
    return {
      model: parsed.model || "gemini-2.0-flash",
      summary: parsed.summary || parsed.review || fallback.summary,
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
      codeSmells: Array.isArray(parsed.codeSmells) ? parsed.codeSmells : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      complexity: parsed.complexity && typeof parsed.complexity === "object"
        ? parsed.complexity
        : { score: 0, level: "unknown", explanation: parsed.complexity || "Complexity not available." },
      namingSuggestions: Array.isArray(parsed.namingSuggestions) ? parsed.namingSuggestions : [],
      performanceOptimizations: Array.isArray(parsed.performanceOptimizations) ? parsed.performanceOptimizations : [],
      explanation: parsed.explanation || fallback.explanation,
      documentation: parsed.documentation || fallback.documentation,
      refactoring: Array.isArray(parsed.refactoring) ? parsed.refactoring : [],
      status: parsed.status || "completed",
    };
  } catch (error) {
    return {
      ...fallback,
      summary: trimmed.replace(/\*\*/g, "").trim() || fallback.summary,
      status: "parsed_text",
    };
  }
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

    if (normalizedLanguage === "javascript") {
      // For JavaScript, run ESLint
      const output = execSync(
        `npx eslint "${filePath}" --no-eslintrc --parser-options "{\\"ecmaVersion\\":2020}" --rule "semi: error" --rule "no-unused-vars: error"`,
        { encoding: "utf8", timeout: 60000, shell: true }
      );
      return normalizeStaticAnalysis("eslint", output);
    }

    // For Java, C, C++ and other languages without a configured linter, return a basic analysis
    return {
      tool: "basic",
      summary: `Static analysis not available for ${language}. AI review will analyze the code.`,
      issues: [],
    };
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
    let aiReview = createFallbackAiReview();

    // Retry Gemini API up to 3 times with exponential backoff for quota/resource exhaustion
    const maxGeminiRetries = 3;
    for (let attempt = 1; attempt <= maxGeminiRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        const rawText = response?.text || response?.candidates?.map((candidate) => candidate?.content?.parts?.map((part) => part?.text || "").join("") || "").join("") || "";
        review = rawText || review;
        aiReview = normalizeAiReview(rawText);
        break; // Success - exit retry loop
      } catch (geminiError) {
        const isQuotaError = geminiError?.status === 429;
        const isServerError = geminiError?.status >= 500;
        
        if (isQuotaError || isServerError) {
          if (attempt < maxGeminiRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s backoff
            console.warn(`Gemini API error (${geminiError.status}), retrying in ${delay}ms (attempt ${attempt}/${maxGeminiRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          console.error("Gemini review generation failed after all retries:", geminiError.message);
        } else {
          console.error("Gemini review generation failed:", geminiError);
        }
        aiReview = createFallbackAiReview();
        break;
      }
    }

    const newReview = await CodeReview.create({
      language,
      code,
      review: aiReview.summary || review,
      bugs: Math.max(0, Array.isArray(staticAnalysis.issues) ? staticAnalysis.issues.length : 0),
      suggestions: Math.max(0, Array.isArray(staticAnalysis.issues) ? staticAnalysis.issues.length : 0),
      staticAnalysis: {
        tool: staticAnalysis.tool || "",
        summary: staticAnalysis.summary || "No issues found",
        issues: Array.isArray(staticAnalysis.issues) ? staticAnalysis.issues : [],
      },
      aiReview,
    });

    res.status(201).json({
      message: "Code reviewed successfully",
      data: {
        ...newReview.toObject(),
        staticAnalysis,
        aiReview,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get History with pagination
const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      CodeReview.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      CodeReview.countDocuments(),
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
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
    const completedAiReviews = reviews.filter((review) => (review.aiReview?.status || "").toLowerCase() === "completed").length;
    const fallbackAiReviews = reviews.filter((review) => (review.aiReview?.status || "").toLowerCase() === "fallback").length;
    const latestAiSummary = reviews.find((review) => review.aiReview?.summary)?.aiReview?.summary || "No AI review available";

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
      aiReview: {
        completedCount: completedAiReviews,
        fallbackCount: fallbackAiReviews,
        latestSummary: latestAiSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await CodeReview.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  uploadCode,
  getHistory,
  getStats,
  deleteReview,
};
