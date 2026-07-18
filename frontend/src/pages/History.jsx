import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:5000/api/reviews/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. You may need to log in again.");
    } finally {
      setDeletingId(null);
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
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={deletingId === review._id}
                    style={{
                      background: "#fee2e2",
                      color: "#b91c1c",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {deletingId === review._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
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
              {(review.staticAnalysis?.issues || []).length > 0 && (
                <ul style={{ marginBottom: "14px", paddingLeft: "20px", color: "#334155" }}>
                  {(review.staticAnalysis?.issues || []).map((issue, index) => {
                    const description = typeof issue === "string" ? issue : issue.description || "No description";
                    const severity = typeof issue === "string" ? "warning" : issue.severity || "warning";
                    return (
                      <li key={`${review._id}-${index}`}>
                        <strong>{severity}</strong>: {description}
                      </li>
                    );
                  })}
                </ul>
              )}

              <h3 style={{ margin: "8px 0", color: "#1e293b" }}>AI Review</h3>
              <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: "10px" }}>
                <strong>Summary:</strong> {review.aiReview?.summary || review.review || "No review available"}
              </p>
              <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: "10px" }}>
                <strong>Explanation:</strong> {review.aiReview?.explanation || "No explanation available"}
              </p>
              {review.aiReview?.bugs?.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#1e293b" }}>Potential Bugs:</strong>
                  <ul style={{ marginTop: "6px", paddingLeft: "20px", color: "#334155" }}>
                    {review.aiReview.bugs.map((bug, index) => (
                      <li key={`${review._id}-bug-${index}`}>{typeof bug === "string" ? bug : bug.description || bug.message || bug}</li>
                    ))}
                  </ul>
                </div>
              )}
              {review.aiReview?.codeSmells?.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#1e293b" }}>Code Smells:</strong>
                  <ul style={{ marginTop: "6px", paddingLeft: "20px", color: "#334155" }}>
                    {review.aiReview.codeSmells.map((smell, index) => (
                      <li key={`${review._id}-smell-${index}`}>{typeof smell === "string" ? smell : smell.description || smell.message || smell}</li>
                    ))}
                  </ul>
                </div>
              )}
              {review.aiReview?.improvements?.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#1e293b" }}>Improvements:</strong>
                  <ul style={{ marginTop: "6px", paddingLeft: "20px", color: "#334155" }}>
                    {review.aiReview.improvements.map((item, index) => (
                      <li key={`${review._id}-improvement-${index}`}>{typeof item === "string" ? item : item.description || item.message || item}</li>
                    ))}
                  </ul>
                </div>
              )}

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