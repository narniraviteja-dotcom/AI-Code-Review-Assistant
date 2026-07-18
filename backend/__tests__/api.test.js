const request = require("supertest");
const http = require("http");
const express = require("express");
const cors = require("cors");

// Mock the entire mongoose model
jest.mock("../models/CodeReview", () => {
  const mockCodeReview = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    lean: jest.fn(),
  };
  return mockCodeReview;
});

const CodeReview = require("../models/CodeReview");

// Mock the auth middleware
jest.mock("../middleware/auth", () => (req, res, next) => {
  req.user = { _id: "609c1e5c8f1b2c001f1b2c3d" };
  next();
});

// Mock the gemini AI module
jest.mock("../config/gemini", () => ({
  models: {
    generateContent: jest.fn(),
  },
}));

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const codeReviewRoutes = require("../routes/codeReview");
app.use("/api/reviews", codeReviewRoutes);

app.get("/", (req, res) => {
  res.send("AI Code Review Assistant Backend Running");
});

// Global error handler for tests
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns health check message", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.text).toContain("AI Code Review Assistant Backend Running");
    });
  });

  describe("GET /api/reviews/stats", () => {
    it("returns stats with zero values when no reviews exist", async () => {
      CodeReview.countDocuments.mockResolvedValue(0);
      CodeReview.aggregate.mockResolvedValue([]);
      CodeReview.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app).get("/api/reviews/stats");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalReviews", 0);
      expect(res.body).toHaveProperty("bugsFound");
      expect(res.body).toHaveProperty("suggestions");
      expect(res.body).toHaveProperty("staticAnalysis");
      expect(res.body).toHaveProperty("aiReview");
    });
  });

  describe("GET /api/reviews/history", () => {
    it("returns paginated history with defaults", async () => {
      CodeReview.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      CodeReview.countDocuments.mockResolvedValue(0);

      const res = await request(app).get("/api/reviews/history");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("reviews");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("page", 1);
    });

    it("handles custom page and limit parameters", async () => {
      CodeReview.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      CodeReview.countDocuments.mockResolvedValue(0);

      const res = await request(app).get("/api/reviews/history?page=2&limit=5");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/reviews/upload", () => {
    it("returns 400 when language and code are missing", async () => {
      const res = await request(app).post("/api/reviews/upload").send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Language and code are required");
    });

    it("returns 400 when only language is provided", async () => {
      const res = await request(app)
        .post("/api/reviews/upload")
        .send({ language: "JavaScript" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Language and code are required");
    });

    it("returns 400 when only code is provided", async () => {
      const res = await request(app)
        .post("/api/reviews/upload")
        .send({ code: "console.log('hi');" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Language and code are required");
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    it("returns 404 when review does not exist", async () => {
      CodeReview.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/reviews/609c1e5c8f1b2c001f1b2c3d")
        .set("Authorization", "Bearer test-token");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Review not found");
    });
  });

  describe("404 handler", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/api/nonexistent");
      expect(res.status).toBe(404);
    });
  });
});