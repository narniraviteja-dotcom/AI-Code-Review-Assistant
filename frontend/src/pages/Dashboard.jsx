import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      <h1 className="dashboard-title">Dashboard</h1>

      <div className="cards">

        <div className="card-box">
          <h2>0</h2>
          <p>Total Reviews</p>
        </div>

        <div className="card-box">
          <h2>0</h2>
          <p>Bugs Found</p>
        </div>

        <div className="card-box">
          <h2>0</h2>
          <p>Suggestions</p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;