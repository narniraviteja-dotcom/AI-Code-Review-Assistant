import { useMemo } from "react";
import { getCurrentUser } from "../auth";
import "./Dashboard.css";

function Profile() {
  const currentUser = useMemo(() => getCurrentUser(), []);

  if (!currentUser) {
    return (
      <div className="dashboard">
        <h1 className="dashboard-title">Profile</h1>
        <div className="cards">
          <div className="card-box" style={{ width: "400px" }}>
            <p>You are not logged in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Profile</h1>

      <div className="cards">
        <div
          className="card-box"
          style={{
            width: "450px",
            textAlign: "left",
            padding: "32px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
              margin: "0 auto 20px",
            }}
          >
            {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
          </div>

          <h2
            style={{
              textAlign: "center",
              color: "#1e293b",
              marginBottom: "24px",
              fontSize: "24px",
            }}
          >
            {currentUser.name || "User"}
          </h2>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ color: "#64748b", fontSize: "13px", display: "block" }}>Name</span>
              <span style={{ color: "#1e293b", fontWeight: 600 }}>{currentUser.name || "Not provided"}</span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ color: "#64748b", fontSize: "13px", display: "block" }}>Email</span>
              <span style={{ color: "#1e293b", fontWeight: 600 }}>{currentUser.email || "Not provided"}</span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ color: "#64748b", fontSize: "13px", display: "block" }}>User ID</span>
              <span style={{ color: "#1e293b", fontWeight: 600, fontSize: "13px", wordBreak: "break-all" }}>
                {currentUser._id || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;