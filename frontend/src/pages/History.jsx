import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reviews/history");
      setReviews(res.data || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Review History</h1>

      {loading ? (
        <div className="cards">
          <div className="card-box">
            <p>Loading reviews...</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="cards">
          <div className="card-box">
            <p>No reviews found</p>
          </div>
        </div>
      ) : (
        <div className="cards" style={{ justifyContent: "flex-start", alignItems: "stretch" }}>
          {reviews.map((review) => (
            <div
              key={review._id}
              className="card-box"
              style={{
                width: "100%",
                maxWidth: "900px",
                textAlign: "left",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "6px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {review.language}
                </span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>
                  {new Date(review.createdAt).toLocaleString()}
                </span>
              </div>

              <h3 style={{ margin: "8px 0", color: "#1e293b" }}>Code</h3>
              <pre
                style={{
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "8px",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#334155",
                  marginBottom: "14px",
                }}
              >
                {review.code}
              </pre>

              <h3 style={{ margin: "8px 0", color: "#1e293b" }}>Static Code Analysis</h3>
              <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: "10px" }}>
                <strong>Tool:</strong> {review.staticAnalysis?.tool || "Not available"}
              </p>
              <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: "10px" }}>
                {review.staticAnalysis?.summary || "No static analysis output available."}
              </p>
              {review.staticAnalysis?.issues?.length > 0 && (
                <ul style={{ marginBottom: "14px", paddingLeft: "20px", color: "#334155" }}>
                  {review.staticAnalysis.issues.map((issue, index) => (
                    <li key={`${review._id}-${index}`}>{issue}</li>
                  ))}
                </ul>
              )}

              <h3 style={{ margin: "8px 0", color: "#1e293b" }}>AI Review</h3>
              <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: "14px" }}>
                {review.review || "No review available"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  color: "#475569",
                }}
              >
                <span>
                  <strong>Bugs:</strong> {review.bugs}
                </span>
                <span>
                  <strong>Suggestions:</strong> {review.suggestions}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;