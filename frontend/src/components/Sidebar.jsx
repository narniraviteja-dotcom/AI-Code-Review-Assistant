import { Link, useNavigate } from "react-router-dom";
import { clearStoredAuth } from "../auth";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  return (
    <div className="sidebar">
      <h2>AI Review</h2>

      <Link to="/dashboard">🏠 Dashboard</Link>
      <Link to="/upload">📂 Upload Code</Link>
      <Link to="/history">📜 History</Link>
      <Link to="/profile">👤 Profile</Link>
      <button type="button" onClick={handleLogout} className="logout-button">
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;