const mongoose = require("mongoose");

const codeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    review: {
      type: String,
      default: "",
    },
    bugs: {
      type: Number,
      default: 0,
    },
    suggestions: {
      type: Number,
      default: 0,
    },
    staticAnalysis: {
      tool: {
        type: String,
        default: "",
      },
      summary: {
        type: String,
        default: "",
      },
      issues: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },
    aiReview: {
      model: {
        type: String,
        default: "",
      },
      summary: {
        type: String,
        default: "",
      },
      bugs: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      codeSmells: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      improvements: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      complexity: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      namingSuggestions: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      performanceOptimizations: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      explanation: {
        type: String,
        default: "",
      },
      documentation: {
        type: String,
        default: "",
      },
      refactoring: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      status: {
        type: String,
        default: "completed",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CodeReview", codeReviewSchema);