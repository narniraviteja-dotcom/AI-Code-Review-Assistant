import React, { useState } from "react";
import axios from "axios";
import "./UploadCode.css";

function UploadCode() {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/reviews/upload",
        {
          language,
          code,
        }
      );

      alert(response.data.message);

      setLanguage("Python");
      setCode("");
    } catch (error) {
      console.error(error);
      alert("Failed to upload code");
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
        ></textarea>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default UploadCode;