import { useState } from "react";
import axios from "axios";
function App() {
  const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleRegister = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/users/register", {
      name,
      email,
      password,
    });

    alert(res.data.message);
    setName("");
setEmail("");
setPassword("");
  } catch (err) {
    alert("Registration failed");
  }
};
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "25px",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Register</h2>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => {
  setName(e.target.value);
}}
          style={{
            width: "100%",
            padding: "10px",
            margin: "10px 0",
          }}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
onChange={(e) => {
  setEmail(e.target.value);
}}
          style={{
            width: "100%",
            padding: "10px",
            margin: "10px 0",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
onChange={(e) => {
  setPassword(e.target.value);
}}
          style={{
            width: "100%",
            padding: "10px",
            margin: "10px 0",
          }}
        />

        <button
  onClick={handleRegister}
  style={{
    width: "100%",
    padding: "10px",
    background: "blue",
    color: "white",
    border: "none",
    cursor: "pointer",
  }}
>
  Register
</button>
      </div>
    </div>
  );
}

export default App;