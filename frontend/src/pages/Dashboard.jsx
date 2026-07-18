import React, { useEffect, useState } from "react";
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
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reviews/stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const issueRows = stats.staticAnalysis?.issues || [];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

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
      </div>

      <div className="analysis-section">
        <div className="analysis-header">
          <div>
            <p className="section-label">Static Analysis</p>
            <h2>Code Quality Overview</h2>
          </div>
          <span className="tool-badge">{stats.staticAnalysis?.latestTool || "None"}</span>
        </div>

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