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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CodeReview", codeReviewSchema);