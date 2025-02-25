import React, { useState, useRef, useEffect } from "react";
import "../styles/Battle.css";
import pigeonImage from "../assets/pigeon.png";
import pigeonDeadImage from "../assets/dead.png";
import enaImage from "../assets/ena.png";
import enaFaintImage from "../assets/enafaint.png";
import slapSound from "../assets/slap.mp3";
import superSound from "../assets/super.mp3";
import dammitSound from "../assets/dammit.mp3";
import useTypewriter from "../hooks/useTypewriter";

// Sample quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4",
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mars", "Mercury", "Earth"],
    correctAnswer: "Mercury",
  },
  {
    question: "What is the largest mammal?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: "Blue Whale",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correctAnswer: "Da Vinci",
  },
];

interface BattleProps {
  onBattleEnd: (won: boolean) => void;
  playerHealth: number;
  pigeonHealth: number;
  onHealthChange: (player: number, pigeon: number) => void;
}

export const Battle: React.FC<BattleProps> = ({ onBattleEnd, playerHealth, pigeonHealth, onHealthChange }) => {
  const [currentQuestion, setCurrentQuestion] = useState(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
  const [message, setMessage] = useState("");
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [isFainted, setIsFainted] = useState(false);
  const [isPigeonDefeated, setIsPigeonDefeated] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const slapAudioRef = useRef<HTMLAudioElement | null>(null);
  const superAudioRef = useRef<HTMLAudioElement | null>(null);
  const dammitAudioRef = useRef<HTMLAudioElement | null>(null);

  const { displayedText } = useTypewriter(message || "", 30);

  useEffect(() => {
    // Initialize sound effects
    slapAudioRef.current = new Audio(slapSound);
    slapAudioRef.current.volume = 0.7;

    superAudioRef.current = new Audio(superSound);
    superAudioRef.current.volume = 0.7;

    dammitAudioRef.current = new Audio(dammitSound);
    dammitAudioRef.current.volume = 0.7;

    return () => {
      if (slapAudioRef.current) {
        slapAudioRef.current.pause();
        slapAudioRef.current = null;
      }
      if (superAudioRef.current) {
        superAudioRef.current.pause();
        superAudioRef.current = null;
      }
      if (dammitAudioRef.current) {
        dammitAudioRef.current.pause();
        dammitAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (message === "It's super effective!" || message === "The attack missed!") {
      const timer = setTimeout(() => {
        setShowQuestion(true);
        setMessage("");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAnswer = (selectedAnswer: string) => {
    setShowQuestion(false);
    const correct = selectedAnswer === QUIZ_QUESTIONS[currentQuestion].correctAnswer;

    if (correct) {
      setIsAttacking(true);
      if (superAudioRef.current) {
        superAudioRef.current.currentTime = 0;
        superAudioRef.current.play();
      }
      setTimeout(() => {
        setMessage("It's super effective!");
        setIsDamaged(true);
        const newPigeonHealth = pigeonHealth - 1;
        const nextQuestion = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
        setCurrentQuestion(nextQuestion);
        onHealthChange(playerHealth, newPigeonHealth);

        if (newPigeonHealth <= 0) {
          setIsPigeonDefeated(true);
          setMessage("Wild PIGEON fainted!");
          setTimeout(() => onBattleEnd(true), 1500);
          return;
        }

        setTimeout(() => {
          setIsAttacking(false);
          setIsDamaged(false);
        }, 1500);
      }, 500);
    } else {
      if (slapAudioRef.current) {
        slapAudioRef.current.currentTime = 0;
        slapAudioRef.current.play();
      }
      setMessage("The attack missed!");
      const newPlayerHealth = playerHealth - 1;
      const nextQuestion = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
      setCurrentQuestion(nextQuestion);
      onHealthChange(newPlayerHealth, pigeonHealth);

      if (newPlayerHealth <= 0) {
        setIsFainted(true);
        setMessage("ENA fainted...");
        if (dammitAudioRef.current) {
          dammitAudioRef.current.currentTime = 0;
          dammitAudioRef.current.play();
        }
        // Keep the battle open for 5 seconds after losing
        setTimeout(() => onBattleEnd(false), 5000);
        return;
      }
    }
  };

  return (
    <div className="battle-screen">
      <div className="battle-scene">
        <div className="enemy-section">
          <div className="enemy-info">
            <div className="name-level">
              <span className="name">PIGEON</span>
              <span className="level">Lv5</span>
            </div>
            <div className="health-container">
              <div className="hp-label">HP</div>
              <div className="health-bar-inner">
                <div
                  className={`health-fill ${isDamaged ? "damage-flash" : ""}`}
                  style={{ width: `${(pigeonHealth / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className={`enemy-pokemon ${isDamaged ? "damage-shake" : ""}`}>
            <img
              src={isPigeonDefeated ? pigeonDeadImage : pigeonImage}
              alt="PIGEON"
              className="PIGEON-sprite"
              width={230}
            />
          </div>
        </div>

        <div className="player-section">
          <div className="player-info">
            <div className="name-level">
              <span className="name">ENA</span>
              <span className="level">Lv5</span>
            </div>
            <div className="health-container">
              <div className="hp-label">HP</div>
              <div className="health-bar-inner">
                <div className="health-fill" style={{ width: `${(playerHealth / 3) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className={`player-pokemon ${isAttacking ? "attack-bounce" : ""}`}>
            <img src={isFainted ? enaFaintImage : enaImage} alt="Ena" className="player-back-sprite" width={230} />
          </div>
        </div>
      </div>

      <div className="battle-menu">
        {message ? (
          <div className="message-box">{displayedText}</div>
        ) : showQuestion ? (
          <div className="question-box">
            <p>{QUIZ_QUESTIONS[currentQuestion].question}</p>
            <div className="options-grid">
              {QUIZ_QUESTIONS[currentQuestion].options.map((option) => (
                <button key={option} onClick={() => handleAnswer(option)} className="option-button">
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Battle;
