import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    try {
      if (isLogin) {
        const res = await axios.post(
          "http://localhost:5000/api/users/login",
          {
            email,
            password,
          }
        );

        alert(res.data.message);

        setEmail("");
        setPassword("");

        navigate("/dashboard");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/users/register",
          {
            name,
            email,
            password,
          }
        );

        alert(res.data.message);

        setName("");
        setEmail("");
        setPassword("");

        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");

      setPassword("");
    }
  };

  return (
    <div className="container">
      <div className="card">

        <h1>AI Code Review Assistant</h1>

        <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={submit}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p
          onClick={() => {
            setIsLogin(!isLogin);
            setName("");
            setEmail("");
            setPassword("");
          }}
        >
          {isLogin
            ? "Create New Account"
            : "Already have an account?"}
        </p>

      </div>
    </div>
  );
}

export default Login;