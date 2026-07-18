import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    bugsFound: 0,
    suggestions: 0,
    staticAnalysis: {
      totalIssues: 0,
      errorsCount: 0,
      warningsCount: 0,
      latestTool: "None",
      issues: [],
    },
    aiReview: {
      completedCount: 0,
      fallbackCount: 0,
      latestSummary: "No AI review available",
    },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reviews/stats");
      setStats(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const issueRows = stats.staticAnalysis?.issues || [];

  return (
    <div className="dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
        <h1 className="dashboard-title" style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastUpdated && (
            <span style={{ color: "#64748b", fontSize: "13px" }}>
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            className={`refresh-btn ${refreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="cards">
        <div className="card-box">
          <h2>{stats.totalReviews}</h2>
          <p>Total Reviews</p>
        </div>

        <div className="card-box">
          <h2>{stats.bugsFound}</h2>
          <p>Bugs Found</p>
        </div>

        <div className="card-box">
          <h2>{stats.suggestions}</h2>
          <p>Suggestions</p>
        </div>

        <div className="card-box">
          <h2>{stats.staticAnalysis?.totalIssues || 0}</h2>
          <p>Total Issues</p>
        </div>

        <div className="card-box">
          <h2>{stats.staticAnalysis?.errorsCount || 0}</h2>
          <p>Errors</p>
        </div>

        <div className="card-box">
          <h2>{stats.staticAnalysis?.warningsCount || 0}</h2>
          <p>Warnings</p>
        </div>

        <div className="card-box">
          <h2>{stats.aiReview?.completedCount || 0}</h2>
          <p>AI Reviews</p>
        </div>
      </div>

      <div className="analysis-section">
        <div className="analysis-header">
          <div>
            <p className="section-label">Static Analysis</p>
            <h2>Code Quality Overview</h2>
          </div>
          <span className="tool-badge">{stats.staticAnalysis?.latestTool || "None"}</span>
        </div>

        <p style={{ color: "#475569", marginBottom: "12px" }}>
          <strong>AI insight:</strong> {stats.aiReview?.latestSummary || "No AI review available"}
        </p>

        {issueRows.length === 0 ? (
          <div className="empty-state">No static analysis issues found.</div>
        ) : (
          <div className="analysis-table-wrap">
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Rule</th>
                  <th>Line</th>
                  <th>Column</th>
                  <th>Description</th>
                  <th>Suggested Fix</th>
                </tr>
              </thead>
              <tbody>
                {issueRows.map((issue, index) => (
                  <tr key={`${issue.reviewId || index}-${index}`}>
                    <td>{stats.staticAnalysis?.latestTool || "Unknown"}</td>
                    <td>
                      <span className={`status-badge ${issue.severity || "warning"}`}>
                        {issue.severity || "warning"}
                      </span>
                    </td>
                    <td>{issue.category || "quality"}</td>
                    <td>{issue.ruleName || "—"}</td>
                    <td>{issue.line || "—"}</td>
                    <td>{issue.column || "—"}</td>
                    <td>{issue.description || "No description"}</td>
                    <td>{issue.suggestedFix || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;