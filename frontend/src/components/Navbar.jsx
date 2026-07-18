import { useMemo } from "react";
import { getCurrentUser } from "../auth";
import "./Navbar.css";

function Navbar() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const displayName = currentUser?.name || currentUser?.email || "User";

  return (
    <div className="navbar">
      <h2>AI Code Review Assistant</h2>

      <div className="user">
        Welcome, {displayName} 👋
      </div>
    </div>
  );
}

export default Navbar;