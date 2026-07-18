import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    bugsFound: 0,
    suggestions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reviews/stats"
      );

      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

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
      </div>
    </div>
  );
}

export default Dashboard;