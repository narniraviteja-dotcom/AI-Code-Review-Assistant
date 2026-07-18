import React, { useState } from "react";
import axios from "axios";
import "./UploadCode.css";

function UploadCode() {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/reviews/upload",
        {
          language,
          code,
        }
      );

      setResult(response.data.data);
      setLanguage("Python");
      setCode("");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to upload code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Your Code</h1>

      <form onSubmit={handleSubmit}>
        <label>Programming Language</label>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={loading}
        >
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="JavaScript">JavaScript</option>
          <option value="C">C</option>
          <option value="C++">C++</option>
        </select>

        <label>Paste Your Code</label>

        <textarea
          rows="15"
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
        ></textarea>

        <button type="submit" disabled={loading || !code.trim()}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {loading && (
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Running static analysis and AI review...</p>
        </div>
      )}

      {error && (
        <div className="error-section">
          <p>{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="result-section">
          <h2>Review Results</h2>

          <div className="result-meta">
            <span className="lang-badge">{result.language}</span>
            <span className="bug-count">Bugs: {result.bugs}</span>
            <span className="suggestion-count">Suggestions: {result.suggestions}</span>
          </div>

          {result.staticAnalysis && (
            <div className="result-block">
              <h3>Static Analysis</h3>
              <p><strong>Tool:</strong> {result.staticAnalysis.tool || "N/A"}</p>
              <p><strong>Summary:</strong> {result.staticAnalysis.summary}</p>
              {result.staticAnalysis.issues?.length > 0 && (
                <ul>
                  {result.staticAnalysis.issues.map((issue, index) => (
                    <li key={index}>
                      <strong>{issue.severity}</strong>: {issue.description}
                      {issue.line && <span> (Line {issue.line})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result.aiReview && (
            <div className="result-block">
              <h3>AI Review</h3>
              <p><strong>Summary:</strong> {result.aiReview.summary}</p>
              <p><strong>Explanation:</strong> {result.aiReview.explanation}</p>
              <p><strong>Status:</strong> {result.aiReview.status}</p>

              {result.aiReview.bugs?.length > 0 && (
                <div className="result-subsection">
                  <h4>Potential Bugs</h4>
                  <ul>
                    {result.aiReview.bugs.map((bug, i) => (
                      <li key={i}>{typeof bug === "string" ? bug : bug.description || bug.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.aiReview.codeSmells?.length > 0 && (
                <div className="result-subsection">
                  <h4>Code Smells</h4>
                  <ul>
                    {result.aiReview.codeSmells.map((smell, i) => (
                      <li key={i}>{typeof smell === "string" ? smell : smell.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.aiReview.improvements?.length > 0 && (
                <div className="result-subsection">
                  <h4>Improvements</h4>
                  <ul>
                    {result.aiReview.improvements.map((item, i) => (
                      <li key={i}>{typeof item === "string" ? item : item.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadCode;