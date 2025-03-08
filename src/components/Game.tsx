import React, { useState, useEffect, useRef, useCallback } from "react";
import Battle from "../features/battle/Battle";
import "../styles/Game.css";
import characterSprite from "../assets/character.png";
import characterSwimSprite from "../assets/character-swim.png";
import grassTile from "../assets/grass.jpg";
import grass2Tile from "../assets/grass2.jpg";
import sandTile from "../assets/sand.jpg";
import seaTile from "../assets/sea.jpg";
import treeTile from "../assets/tree.jpg";
import battleMusic from "../assets/battle.mp3";
import victoryMusic from "../assets/victory.mp3";
import themeMusic from "../assets/theme.mp3";
import pokecenterImage from "../assets/pokecenter.png";
import healSound from "../assets/heal.mp3";
import homeImage from "../assets/home.png";
import pokeball1 from "../assets/pokeballs/pokeball1.png";
import pokeball2 from "../assets/pokeballs/pokeball2.png";
import pokeball3 from "../assets/pokeballs/pokeball3.png";
import pokeball4 from "../assets/pokeballs/pokeball4.png";
import pokeball5 from "../assets/pokeballs/pokeball5.png";
import { EnemyType } from "../features/battle/battleTypes";
import { useWallet } from "@alephium/web3-react";
import MintButton from "../features/mint/MintButton";
import PasswordScreen from "./PasswordScreen";

interface Position {
  x: number;
  y: number;
}

interface Pokeball {
  position: Position;
  type: number; // 1-5 for different pokeball types
}

interface GameState {
  playerPosition: Position;
  inBattle: boolean;
  playerHealth: number;
  enemyHealth: number;
  isTransitioning: boolean;
  isVictory: boolean;
  hasInteracted: boolean;
  stepsInGrass: number;
  stepsUntilBattle: number;
  currentEnemyType: EnemyType;
  isSwimming: boolean;
  battlesWon: number;
  pokeballs: Pokeball[];
  showPokeballMessage: boolean;
  mintedNfts: string[];
  isPasswordValidated: boolean;
  isTestMode: boolean;
}

const GRID_SIZE = 10;
const MAX_HEALTH = 3; // Maximum health for both player and enemies

// High grass where Pokémon can be found (top-right region)
const GRASS_PATCHES = [
  // First row
  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 9, y: 0 },
  // Second row
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
  { x: 9, y: 1 },
  // Third row
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
  { x: 9, y: 2 },
  // Fourth row
  { x: 7, y: 3 },
  { x: 8, y: 3 },
  { x: 9, y: 3 },
  // Fifth row
  { x: 8, y: 4 },
  { x: 9, y: 4 },
];

// Short grass with no Pokémon (surrounds tall grass)
const GRASS2_PATCHES = [
  // Border above tall grass
  { x: 5, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 1 },
  // Left border
  { x: 5, y: 1 },
  { x: 5, y: 2 },
  { x: 4, y: 2 },
  { x: 4, y: 3 },
  { x: 4, y: 4 },
  { x: 5, y: 3 },
  { x: 5, y: 4 },
  // Bottom border (removed overlapping coordinates in row 5)
  { x: 6, y: 3 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
  // Right border
  { x: 9, y: 6 },
  // Transition patches where trees were removed
  { x: 4, y: 5 },
  { x: 4, y: 6 },
  { x: 4, y: 7 },
  { x: 4, y: 8 },
];

// Sea tiles in the bottom right corner
const SEA_PATCHES = [
  // Row 8
  { x: 7, y: 8 },
  { x: 8, y: 8 },
  { x: 9, y: 8 },
  // Row 9
  { x: 7, y: 9 },
  { x: 8, y: 9 },
  { x: 9, y: 9 },
];

// Tree patches to create a forest between grass and sea
const TREE_PATCHES = [
  // Trees one line above the existing forest (row 5)
  { x: 6, y: 5 },
  { x: 7, y: 5 },
  { x: 8, y: 5 },
  { x: 9, y: 5 },
  { x: 5, y: 5 },
  // Trees directly below tall grass
  { x: 6, y: 6 },
  { x: 7, y: 6 },
  { x: 8, y: 6 },
  { x: 9, y: 6 },
  { x: 5, y: 6 },
  // Row 6 - Trees below grass area
  { x: 6, y: 7 },
  { x: 7, y: 7 },
  { x: 8, y: 7 },
  { x: 9, y: 7 },
  { x: 5, y: 7 },
  // Row 7 - Trees above sea
  { x: 6, y: 8 },
  { x: 5, y: 8 },
];

// The row 7 will be sand by default, creating a beach transition between grass and sea

// Helper function to get valid pokeball spawn positions
const getValidPokeballPositions = () => {
  const validPositions: Position[] = [];

  // Check each cell in the grid
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Check if position is not in any special terrain
      const isGrass = GRASS_PATCHES.some((patch) => patch.x === x && patch.y === y);
      const isNormalGrass = GRASS2_PATCHES.some((patch) => patch.x === x && patch.y === y);
      const isTree = TREE_PATCHES.some((patch) => patch.x === x && patch.y === y);
      const isPokecenter = x === 1 && y === 8;
      const isHome = x === 1 && y === 1;

      // If it's a valid position (sand or sea), add it to valid positions
      if (!isGrass && !isNormalGrass && !isTree && !isPokecenter && !isHome) {
        validPositions.push({ x, y });
      }
    }
  }

  return validPositions;
};

// Helper function to spawn a new pokeball
const spawnPokeball = (existingPokeballs: Pokeball[]): Pokeball | null => {
  const validPositions = getValidPokeballPositions();

  // Filter out positions that already have pokeballs
  const availablePositions = validPositions.filter(
    (pos) => !existingPokeballs.some((ball) => ball.position.x === pos.x && ball.position.y === pos.y)
  );

  if (availablePositions.length === 0) return null;

  // Get random position and pokeball type
  const randomPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
  const randomType = Math.floor(Math.random() * 5) + 1;

  return {
    position: randomPosition,
    type: randomType,
  };
};

const TypewriterMessage: React.FC<{
  onComplete?: () => void;
  onMintClick: () => void;
  mintedNfts: string[];
  onNftMinted: (nftUrl: string) => void;
}> = ({ onComplete, onMintClick, mintedNfts, onNftMinted }) => {
  const [displayText, setDisplayText] = useState("");
  const { signer } = useWallet();

  const fullMessage = signer
    ? "Congratulations, you found a gift!"
    : "Congratulations, you found a gift! Connect your Alephium mobile wallet using the button on the top right of the screen (using WalletConnect) and claim your gift NFT!";
  const messageSpeed = 40; // Speed of typing in milliseconds

  useEffect(() => {
    let currentChar = 0;
    const timer = setInterval(() => {
      if (currentChar < fullMessage.length) {
        setDisplayText(fullMessage.slice(0, currentChar + 1));
        currentChar++;
      } else {
        clearInterval(timer);
        if (onComplete) {
          onComplete();
        }
      }
    }, messageSpeed);

    return () => clearInterval(timer);
  }, [fullMessage, onComplete, signer]);

  return (
    <div className="typewriter-message">
      {displayText} <br />
      <br />
      <MintButton onMintClick={onMintClick} mintedNfts={mintedNfts} onNftMinted={onNftMinted} />
    </div>
  );
};

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerPosition: { x: 0, y: 0 },
    inBattle: false,
    playerHealth: MAX_HEALTH,
    enemyHealth: MAX_HEALTH,
    isTransitioning: false,
    isVictory: false,
    hasInteracted: false,
    stepsInGrass: 0,
    stepsUntilBattle: 0,
    currentEnemyType: EnemyType.PIGEON,
    isSwimming: false,
    battlesWon: 0,
    pokeballs: [],
    showPokeballMessage: false,
    mintedNfts: (() => {
      const saved = localStorage.getItem("minted-nfts");
      return saved ? JSON.parse(saved) : [];
    })(),
    isPasswordValidated: (() => {
      const validation = localStorage.getItem("game-password-validated");
      return validation === "true" || validation === "test";
    })(),
    isTestMode: (() => {
      return localStorage.getItem("game-password-validated") === "test";
    })(),
  });

  const battleAudioRef = useRef<HTMLAudioElement | null>(null);
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const themeAudioRef = useRef<HTMLAudioElement | null>(null);
  const healAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (gameState.isPasswordValidated) {
      // Initialize audio elements
      battleAudioRef.current = new Audio(battleMusic);
      battleAudioRef.current.loop = true;

      victoryAudioRef.current = new Audio(victoryMusic);
      victoryAudioRef.current.loop = false;

      themeAudioRef.current = new Audio(themeMusic);
      themeAudioRef.current.loop = true;
      themeAudioRef.current.volume = 0.7;
      // Start playing theme music immediately after password validation
      themeAudioRef.current.play();

      healAudioRef.current = new Audio(healSound);
      healAudioRef.current.loop = false;
      healAudioRef.current.volume = 0.7;

      return () => {
        // Cleanup audio on component unmount or when password becomes invalid
        if (battleAudioRef.current) {
          battleAudioRef.current.pause();
          battleAudioRef.current = null;
        }
        if (victoryAudioRef.current) {
          victoryAudioRef.current.pause();
          victoryAudioRef.current = null;
        }
        if (themeAudioRef.current) {
          themeAudioRef.current.pause();
          themeAudioRef.current = null;
        }
        if (healAudioRef.current) {
          healAudioRef.current.pause();
          healAudioRef.current = null;
        }
      };
    }
  }, [gameState.isPasswordValidated]);

  useEffect(() => {
    // Handle battle music - start playing during transition and battle
    if ((gameState.isTransitioning || gameState.inBattle) && !gameState.isVictory) {
      if (battleAudioRef.current) {
        battleAudioRef.current.play();
      }
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
      }
    } else if ((!gameState.isTransitioning && !gameState.inBattle) || gameState.isVictory) {
      if (battleAudioRef.current) {
        battleAudioRef.current.pause();
        battleAudioRef.current.currentTime = 0;
      }
      // Resume theme music when not in battle and not in victory
      if (!gameState.isVictory && themeAudioRef.current) {
        themeAudioRef.current.play();
      }
    }
  }, [gameState.isTransitioning, gameState.inBattle, gameState.isVictory]);

  useEffect(() => {
    // Handle victory music
    if (gameState.isVictory) {
      if (victoryAudioRef.current) {
        victoryAudioRef.current.currentTime = 0;
        victoryAudioRef.current.play();
      }
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
      }
    }
  }, [gameState.isVictory]);

  const startBattle = () => {
    // Randomly select an enemy type
    const enemyTypes = Object.values(EnemyType);
    const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    setGameState((prev) => ({
      ...prev,
      currentEnemyType: randomEnemyType,
    }));

    setTimeout(() => {
      setGameState((prev) => ({ ...prev, isTransitioning: false, inBattle: true }));
    }, 4000);
  };

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Start theme music on first interaction if not already playing
      if (!gameState.hasInteracted && themeAudioRef.current) {
        themeAudioRef.current.play();
        setGameState((prev) => ({ ...prev, hasInteracted: true }));
      }

      // Prevent any movement if in battle or during battle transition
      if (gameState.inBattle || gameState.isTransitioning) {
        e.preventDefault();
        return;
      }

      // Prevent default scrolling behavior
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      setGameState((prev) => {
        const newPosition = { ...prev.playerPosition };

        switch (e.key) {
          case "ArrowUp":
            if (newPosition.y > 0) newPosition.y -= 1;
            break;
          case "ArrowDown":
            if (newPosition.y < GRID_SIZE - 1) newPosition.y += 1;
            break;
          case "ArrowLeft":
            if (newPosition.x > 0) newPosition.x -= 1;
            break;
          case "ArrowRight":
            if (newPosition.x < GRID_SIZE - 1) newPosition.x += 1;
            break;
          default:
            return prev;
        }

        // Check if the new position is a tree - if so, prevent movement
        const isTree = TREE_PATCHES.some((patch) => patch.x === newPosition.x && patch.y === newPosition.y);
        if (isTree) {
          return prev; // Don't allow movement into trees
        }

        // Check if the new position is sea - allow movement but track it in state
        const isSea = SEA_PATCHES.some((patch) => patch.x === newPosition.x && patch.y === newPosition.y);

        // Check if player is at Pokémon Center (1,8)
        if (newPosition.x === 1 && newPosition.y === 8) {
          // Play healing sound if health is not full
          if (prev.playerHealth < MAX_HEALTH && healAudioRef.current) {
            healAudioRef.current.currentTime = 0;
            healAudioRef.current.play();
          }
          return {
            ...prev,
            playerPosition: newPosition,
            playerHealth: MAX_HEALTH, // Heal to full health
            isSwimming: false, // Not swimming at Pokémon Center
          };
        }

        // Check if player is in tall grass (battle grass)
        const isInBattleGrass = GRASS_PATCHES.some((patch) => patch.x === newPosition.x && patch.y === newPosition.y);
        const wasInBattleGrass = GRASS_PATCHES.some(
          (patch) => patch.x === prev.playerPosition.x && patch.y === prev.playerPosition.y
        );

        // If player just entered the tall grass, set a random number of steps until battle
        if (isInBattleGrass && !wasInBattleGrass) {
          // Generate a random number between 2 and 5 steps
          const randomSteps = Math.floor(Math.random() * 4) + 2;
          return {
            ...prev,
            playerPosition: newPosition,
            stepsInGrass: 1, // First step in grass
            stepsUntilBattle: randomSteps,
            isSwimming: false, // Not swimming in grass
          };
        }

        // If player is still in tall grass, increment step counter
        if (isInBattleGrass && wasInBattleGrass) {
          const newStepsInGrass = prev.stepsInGrass + 1;

          // Check if we've reached the required number of steps for a battle
          if (newStepsInGrass >= prev.stepsUntilBattle) {
            setTimeout(startBattle, 100);
            return {
              ...prev,
              playerPosition: newPosition,
              isTransitioning: true,
              stepsInGrass: 0, // Reset steps counter
              isSwimming: false, // Not swimming during battle
            };
          }

          return {
            ...prev,
            playerPosition: newPosition,
            stepsInGrass: newStepsInGrass,
            isSwimming: false, // Not swimming in grass
          };
        }

        // If player left the tall grass, reset the step counter
        if (!isInBattleGrass && wasInBattleGrass) {
          return {
            ...prev,
            playerPosition: newPosition,
            stepsInGrass: 0,
            isSwimming: isSea, // Set swimming state based on if they're in sea
          };
        }

        // Check if player is on a pokeball
        const isOnPokeball = prev.pokeballs.some(
          (ball) => ball.position.x === newPosition.x && ball.position.y === newPosition.y
        );

        return {
          ...prev,
          playerPosition: newPosition,
          isSwimming: isSea,
          showPokeballMessage: isOnPokeball, // Set message visibility based on pokeball position
        };
      });
    },
    [gameState]
  );

  const handleBattleEnd = (won: boolean) => {
    if (won) {
      setGameState((prev) => {
        const newBattlesWon = prev.battlesWon + 1;
        let newPokeballs = [...prev.pokeballs];

        // Every 3 battles won, spawn a new pokeball
        if (newBattlesWon % 3 === 0) {
          const newPokeball = spawnPokeball(newPokeballs);
          if (newPokeball) {
            newPokeballs = [...newPokeballs, newPokeball];
          }
        }

        return {
          ...prev,
          isVictory: true,
          battlesWon: newBattlesWon,
          pokeballs: newPokeballs,
        };
      });

      // Reset game state after victory celebration
      setTimeout(() => {
        if (victoryAudioRef.current) {
          victoryAudioRef.current.pause();
          victoryAudioRef.current.currentTime = 0;
        }
        setGameState((prev) => {
          // Check if player is in sea after battle
          const isInSea = SEA_PATCHES.some(
            (patch) => patch.x === prev.playerPosition.x && patch.y === prev.playerPosition.y
          );
          return {
            ...prev,
            inBattle: false,
            playerHealth: prev.playerHealth,
            enemyHealth: MAX_HEALTH,
            isVictory: false,
            isSwimming: isInSea, // Set swimming state based on position
          };
        });
      }, 5000); // Extended to 5 seconds for victory celebration
    } else {
      // When player loses, teleport them to Pokémon Center and heal
      if (healAudioRef.current) {
        healAudioRef.current.currentTime = 0;
        healAudioRef.current.play();
      }
      setGameState((prev) => ({
        ...prev,
        inBattle: false,
        playerHealth: MAX_HEALTH, // Heal to full health
        enemyHealth: MAX_HEALTH,
        isVictory: false,
        playerPosition: { x: 1, y: 8 }, // Teleport to Pokémon Center
        isSwimming: false, // Not swimming at Pokémon Center
      }));
    }
  };

  const handleHealthChange = (playerHealth: number, enemyHealth: number) => {
    setGameState((prev) => ({
      ...prev,
      playerHealth,
      enemyHealth,
    }));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.inBattle, handleKeyPress]);

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const isPlayer = gameState.playerPosition.x === x && gameState.playerPosition.y === y;
        const isBattleGrass = GRASS_PATCHES.some((patch) => patch.x === x && patch.y === y);
        const isNormalGrass = GRASS2_PATCHES.some((patch) => patch.x === x && patch.y === y);
        const isSea = SEA_PATCHES.some((patch) => patch.x === x && patch.y === y);
        const isTree = TREE_PATCHES.some((patch) => patch.x === x && patch.y === y);
        const isPokecenter = x === 1 && y === 8;
        const isHome = x === 1 && y === 1;
        const pokeball = gameState.pokeballs.find((ball) => ball.position.x === x && ball.position.y === y);

        row.push(
          <div key={`${x}-${y}`} className="cell">
            {isBattleGrass && <img src={grassTile} alt="Battle Grass" className="terrain-tile" />}
            {isNormalGrass && <img src={grass2Tile} alt="Normal Grass" className="terrain-tile" />}
            {isSea && <img src={seaTile} alt="Sea" className="terrain-tile" />}
            {isTree && <img src={treeTile} alt="Tree" className="terrain-tile" />}
            {!isBattleGrass && !isNormalGrass && !isSea && !isTree && (
              <img src={sandTile} alt="Sand" className="terrain-tile" />
            )}
            {isPokecenter && <img src={pokecenterImage} alt="Pokémon Center" className="pokecenter-sprite" />}
            {isHome && <img src={homeImage} alt="Home" className="home-sprite" />}
            {pokeball && (
              <img
                src={[pokeball1, pokeball2, pokeball3, pokeball4, pokeball5][pokeball.type - 1]}
                alt={`Pokeball ${pokeball.type}`}
                className="pokeball-sprite"
              />
            )}
            {isPlayer && (
              <div className="player-container">
                <div className="player-health">
                  <div
                    className="health-bar"
                    style={{ width: `${(gameState.playerHealth / MAX_HEALTH) * 100}%` }}
                  ></div>
                </div>
                <img
                  src={gameState.isSwimming ? characterSwimSprite : characterSprite}
                  alt="Player"
                  className={`player-sprite ${gameState.isSwimming ? "bobbing" : ""}`}
                />
              </div>
            )}
          </div>
        );
      }
      grid.push(
        <div key={`row-${y}`} className="grid-row">
          {row}
        </div>
      );
    }
    return grid;
  };

  // Add localStorage effect for mintedNfts
  useEffect(() => {
    localStorage.setItem("minted-nfts", JSON.stringify(gameState.mintedNfts));
  }, [gameState.mintedNfts]);

  return (
    <div className="game-container">
      {!gameState.isPasswordValidated ? (
        <PasswordScreen
          onPasswordCorrect={(isTestMode) => {
            setGameState((prev) => ({
              ...prev,
              isPasswordValidated: true,
              isTestMode: isTestMode,
            }));
          }}
        />
      ) : (
        <div className="game-wrapper">
          <div className="game-grid">{renderGrid()}</div>
          {gameState.isTransitioning && (
            <div className="battle-transition">
              <div className="flash-overlay"></div>
              <div className="battle-message">Wild {gameState.currentEnemyType} appeared!</div>
            </div>
          )}
          {gameState.inBattle && (
            <div className="battle-overlay">
              <Battle
                onBattleEnd={handleBattleEnd}
                playerHealth={gameState.playerHealth}
                enemyHealth={gameState.enemyHealth}
                onHealthChange={handleHealthChange}
                enemyType={gameState.currentEnemyType}
                isTestMode={gameState.isTestMode}
              />
            </div>
          )}
          {gameState.showPokeballMessage && !gameState.isTestMode && (
            <div className="message-overlay">
              <TypewriterMessage
                mintedNfts={gameState.mintedNfts}
                onNftMinted={(nftUrl) => {
                  setGameState((prev) => ({
                    ...prev,
                    mintedNfts: [...prev.mintedNfts, nftUrl],
                  }));
                }}
                onMintClick={() => {
                  setGameState((prev) => ({
                    ...prev,
                    showPokeballMessage: false,
                    pokeballs: prev.pokeballs.filter(
                      (ball) => ball.position.x !== prev.playerPosition.x || ball.position.y !== prev.playerPosition.y
                    ),
                  }));
                }}
              />
            </div>
          )}
          {gameState.isTestMode && <div className="test-mode-indicator">Test Mode</div>}
        </div>
      )}
    </div>
  );
};
export default Game;
