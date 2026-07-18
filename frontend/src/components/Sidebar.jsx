import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>AI Review</h2>

      <Link to="/dashboard">🏠 Dashboard</Link>
      <Link to="/upload">📂 Upload Code</Link>
      <Link to="/history">📜 History</Link>
      <Link to="/profile">👤 Profile</Link>
      <Link to="/">🚪 Logout</Link>
    </div>
  );
}

export default Sidebar;