import React, { useState, useRef, useEffect } from "react";
import "../styles/Battle.css";
import pigeonImage from "../assets/pigeon.png";
import pigeonDeadImage from "../assets/dead.png";
import heatImage from "../assets/heat.jpg";
import dishesImage from "../assets/dishes.png";
import incompetentImage from "../assets/incompetent.png";
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
  INCOMPETENT = "INCOMPETENT AGENCY",
}

// Constants
const MAX_HEALTH = 3; // Maximum health for both player and enemies

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

// Damage messages based on damage amount
const DAMAGE_MESSAGES = {
  low: "It's not very effective...",
  medium: "It's effective!",
  high: "It's super effective!",
};

// Enemy-specific miss messages with puns
const ENEMY_MISS_MESSAGES = {
  [EnemyType.PIGEON]: ["Your attack flew right past!", "PIGEON cooed away from danger!", "That was for the birds!"],
  [EnemyType.HEAT]: [
    "The forecast predicts: missed attacks!",
    "Your attack evaporated in the heat!",
    "You're not hot enough to hit that!",
  ],
  [EnemyType.DISHES]: [
    "Your attack didn't dish out any damage!",
    "That attack was washed away!",
    "DIRTY DISHES stacked the odds against you!",
  ],
  [EnemyType.INCOMPETENT]: [
    "They failed to be hit successfully!",
    "Their incompetence somehow helped them dodge!",
    "They accidentally avoided your attack!",
  ],
};

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
      case EnemyType.INCOMPETENT:
        return incompetentImage;
      default:
        return pigeonImage;
    }
  };

  // Generate random damage between 0.5 and 1.5
  const getRandomDamage = () => {
    // Generate a value between 0.5 and 1.5
    return Math.random() + 0.5;
  };

  // Get damage message based on damage amount
  const getDamageMessage = (damage: number) => {
    if (damage < 0.8) return DAMAGE_MESSAGES.low;
    if (damage < 1.2) return DAMAGE_MESSAGES.medium;
    return DAMAGE_MESSAGES.high;
  };

  // Get random miss message based on enemy type
  const getRandomMissMessage = () => {
    const enemyMessages = ENEMY_MISS_MESSAGES[enemyType] || ENEMY_MISS_MESSAGES[EnemyType.PIGEON];
    const randomIndex = Math.floor(Math.random() * enemyMessages.length);
    return enemyMessages[randomIndex];
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
    // Simplified message handling logic
    if (message) {
      // Only handle non-fainted messages with a timeout
      if (!message.includes("fainted")) {
        const timer = setTimeout(() => {
          setShowQuestion(true);
          setMessage("");
        }, 3000);
        return () => clearTimeout(timer);
      }
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
        // Calculate random damage (between 0.5 and 1.5)
        const damageMultiplier = getRandomDamage();
        // Scale damage to ensure enemy dies in about 3 hits
        const damage = damageMultiplier;
        const damageMessage = getDamageMessage(damageMultiplier);

        setMessage(damageMessage);
        setIsDamaged(true);

        // Calculate new enemy health
        const newEnemyHealth = Math.max(0, enemyHealth - damage);
        const nextQuestion = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
        setCurrentQuestion(nextQuestion);
        onHealthChange(playerHealth, newEnemyHealth);

        if (newEnemyHealth <= 0) {
          setIsEnemyDefeated(true);
          setMessage(`Wild ${enemyType} fainted!`);
          // Don't show new questions after enemy faints
          setShowQuestion(false);
          setTimeout(() => onBattleEnd(true), 3000);
          return;
        }

        setTimeout(() => {
          setIsAttacking(false);
          setIsDamaged(false);
        }, 3000);
      }, 500);
    } else {
      if (slapAudioRef.current) {
        slapAudioRef.current.currentTime = 0;
        slapAudioRef.current.play();
      }

      // Get a random miss message for the current enemy type
      setMessage(getRandomMissMessage());

      // Calculate random damage for player (between 0.5 and 1.5)
      const damageMultiplier = getRandomDamage();
      // Scale damage to ensure player dies in about 3 hits
      const damage = damageMultiplier;

      // Calculate new player health
      const newPlayerHealth = Math.max(0, playerHealth - damage);
      const nextQuestion = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
      setCurrentQuestion(nextQuestion);
      onHealthChange(newPlayerHealth, enemyHealth);

      if (newPlayerHealth <= 0) {
        setIsFainted(true);
        setMessage("ENA fainted...");
        // Don't show new questions after player faints
        setShowQuestion(false);
        if (dammitAudioRef.current) {
          dammitAudioRef.current.currentTime = 0;
          dammitAudioRef.current.play();
        }
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
                  style={{ width: `${(enemyHealth / MAX_HEALTH) * 100}%` }}
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
                <div className="health-fill" style={{ width: `${(playerHealth / MAX_HEALTH) * 100}%` }} />
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
        ) : showQuestion && !isEnemyDefeated && !isFainted ? (
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
