import React, { useState } from "react";
import "./PasswordScreen.css";

interface PasswordScreenProps {
  onPasswordCorrect: (isTestMode: boolean) => void;
}

const PasswordScreen: React.FC<PasswordScreenProps> = ({ onPasswordCorrect }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "test") {
      onPasswordCorrect(true); // Enter test mode
      // localStorage.setItem("game-password-validated", "test");
    } else if (password === "pookie") {
      onPasswordCorrect(false); // Enter normal mode
      localStorage.setItem("game-password-validated", "true");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="password-screen">
      <div className="password-container">
        <h2>Enter Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
          />
          <button type="submit" className="password-button">
            Submit
          </button>
        </form>
        <p className="test-message">Enter "test" to check out the game in test mode.</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default PasswordScreen;
