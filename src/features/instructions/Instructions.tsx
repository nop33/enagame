import React, { useState } from "react";
import "./Instructions.css";
import arrowKeys from "../../assets/arrows.png";

const Instructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="instructions-container">
      <button className="instructions-button" onClick={() => setIsOpen(true)}>
        Instructions
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setIsOpen(false)}>
              ×
            </button>
            <h2>How to Play</h2>
            <div className="instructions-content">
              <img src={arrowKeys} alt="Arrow Keys" className="arrow-keys-image" />
              <p>Use the arrow keys on your keyboard to move your character around the map.</p>
              <p>Explore the world, but watch out for dangerous creatures in the tall grass!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructions;
