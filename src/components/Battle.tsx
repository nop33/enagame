import React, { useState, useRef, useEffect } from "react";
import "../styles/Battle.css";
import pigeonImage from "../assets/pigeon.png";
import pigeonDeadImage from "../assets/dead.png";
import heatImage from "../assets/heat.jpg";
import dishesImage from "../assets/dishes.png";
import enaImage from "../assets/ena.png";
import enaFaintImage from "../assets/enafaint.png";
import slapSound from "../assets/slap.mp3";
import superSound from "../assets/super.mp3";
import dammitSound from "../assets/dammit.mp3";
import useTypewriter from "../hooks/useTypewriter";

// Enemy types
export enum EnemyType {
  PIGEON = "PIGEON",
  HEAT = "HEAD & HUMIDITY",
  DISHES = "DIRTY DISHES",
}

// Sample quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "What is 1 + 1?",
    options: ["3", "4", "2", "6"],
    correctAnswer: "2",
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4",
  },
  {
    question: "What is 3 + 3?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "6",
  },
];

interface BattleProps {
  onBattleEnd: (won: boolean) => void;
  playerHealth: number;
  enemyHealth: number;
  onHealthChange: (player: number, enemy: number) => void;
  enemyType: EnemyType;
}

export const Battle: React.FC<BattleProps> = ({
  onBattleEnd,
  playerHealth,
  enemyHealth,
  onHealthChange,
  enemyType,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
  const [message, setMessage] = useState("");
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [isFainted, setIsFainted] = useState(false);
  const [isEnemyDefeated, setIsEnemyDefeated] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const slapAudioRef = useRef<HTMLAudioElement | null>(null);
  const superAudioRef = useRef<HTMLAudioElement | null>(null);
  const dammitAudioRef = useRef<HTMLAudioElement | null>(null);

  const { displayedText } = useTypewriter(message || "", 30);

  // Get enemy image based on type
  const getEnemyImage = () => {
    switch (enemyType) {
      case EnemyType.PIGEON:
        return isEnemyDefeated ? pigeonDeadImage : pigeonImage;
      case EnemyType.HEAT:
        return heatImage;
      case EnemyType.DISHES:
        return dishesImage;
      default:
        return pigeonImage;
    }
  };

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
        const newEnemyHealth = enemyHealth - 1;
        const nextQuestion = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
        setCurrentQuestion(nextQuestion);
        onHealthChange(playerHealth, newEnemyHealth);

        if (newEnemyHealth <= 0) {
          setIsEnemyDefeated(true);
          setMessage(`Wild ${enemyType} fainted!`);
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
      onHealthChange(newPlayerHealth, enemyHealth);

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
              <span className="name">{enemyType}</span>
              <span className="level">Lv5</span>
            </div>
            <div className="health-container">
              <div className="hp-label">HP</div>
              <div className="health-bar-inner">
                <div
                  className={`health-fill ${isDamaged ? "damage-flash" : ""}`}
                  style={{ width: `${(enemyHealth / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className={`enemy-pokemon ${isDamaged ? "damage-shake" : ""}`}>
            <img
              src={getEnemyImage()}
              alt={enemyType}
              className="enemy-sprite"
              width={230}
              style={{ objectFit: "contain" }}
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
