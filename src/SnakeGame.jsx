import React, { useState, useEffect, useRef } from "react";
import styles from "./SnakeGame.module.css";

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_APPLE = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: 0 }; // 1. Start stopped

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [apple, setApple] = useState(INITIAL_APPLE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    localStorage.getItem("snakeHighScore") || 0 // 4. Load High Score
  );
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // 2. Pause state
  const [bgType, setBgType] = useState("sci");
  const [collisionType, setCollisionType] = useState(null);

  const processedTurn = useRef(false);

  // Helper to check if the game has actually started moving
  const isGameActive = direction.x !== 0 || direction.y !== 0;

  // Handle High Score Saving
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snakeHighScore", score);
    }
  }, [score, highScore]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (processedTurn.current || gameOver) return;

      // 2. Toggle Pause with 'p' or Space (Only if game is active)
      if ((e.key === "p" || e.key === " ") && isGameActive) {
        setIsPaused((prev) => !prev);
        return;
      }

      // Handle Arrow Keys
      if (e.key.startsWith("Arrow")) {
        // 2. Auto-resume if an arrow is pressed while paused
        if (isPaused) {
          setIsPaused(false);
        }

        switch (e.key) {
          case "ArrowUp":
            if (direction.y === 0) {
              setDirection({ x: 0, y: -1 });
              processedTurn.current = true;
            }
            break;
          case "ArrowDown":
            if (direction.y === 0) {
              setDirection({ x: 0, y: 1 });
              processedTurn.current = true;
            }
            break;
          case "ArrowLeft":
            if (direction.x === 0) {
              setDirection({ x: -1, y: 0 });
              processedTurn.current = true;
            }
            break;
          case "ArrowRight":
            if (direction.x === 0) {
              setDirection({ x: 1, y: 0 });
              processedTurn.current = true;
            }
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, gameOver, isPaused, isGameActive]);

  // Game Loop
  useEffect(() => {
    // Don't move if stopped (direction 0,0), game over, or paused
    if (gameOver || isPaused || !isGameActive) return;

    // 3. Dynamic Speed: Starts at 150ms, gets faster as score increases
    const currentSpeed = Math.max(50, 150 - score * 2);

    const moveSnake = setInterval(() => {
      processedTurn.current = false;
      setSnake((prevSnake) => {
        const newHead = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x >= CANVAS_SIZE / GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= CANVAS_SIZE / GRID_SIZE
        ) {
          setGameOver(true);
          setCollisionType("wall");
          return prevSnake;
        }

        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          setGameOver(true);
          setCollisionType("self");
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === apple.x && newHead.y === apple.y) {
          setScore((s) => s + 1);
          setApple({
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
          });
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, currentSpeed);

    return () => clearInterval(moveSnake);
  }, [direction, apple, gameOver, isPaused, score, isGameActive]);

  // Rendering
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let snakeColor, glowColor, appleColor;
    if (gameOver && collisionType === "self") {
      snakeColor = glowColor = "#ff0000";
    } else {
      switch (bgType) {
        case "matrix":
          snakeColor = glowColor = "#00ff41";
          appleColor = "#fff";
          break;
        case "space":
          snakeColor = "#fff";
          glowColor = "#8888ff";
          appleColor = "#ffcc00";
          break;
        default:
          snakeColor = glowColor = "#00f2ff";
          appleColor = "#ff0055";
      }
    }

    ctx.fillStyle = snakeColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glowColor;
    snake.forEach((part) => {
      ctx.fillRect(
        part.x * GRID_SIZE,
        part.y * GRID_SIZE,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    });

    ctx.fillStyle = appleColor || "#ff0055";
    ctx.shadowColor = appleColor || "#ff0055";
    ctx.fillRect(
      apple.x * GRID_SIZE,
      apple.y * GRID_SIZE,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    );
    ctx.shadowBlur = 0;
  }, [snake, apple, gameOver, collisionType, bgType]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setApple(INITIAL_APPLE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setCollisionType(null);
    processedTurn.current = false;
  };

  return (
    <div
      className={`${styles.container} ${
        bgType === "matrix"
          ? styles.matrixBg
          : bgType === "space"
          ? styles.spaceBg
          : ""
      }`}
    >
      <h1 className={styles.title}>Snake-Game</h1>
      <div className={styles.scoreContainer}>
        <div className={styles.score}>Score: {score}</div>
        <div className={styles.highScore}>Best: {highScore}</div>
      </div>

      <div
        className={`${styles.canvasContainer} ${
          collisionType === "wall" ? styles.wallHit : ""
        }`}
      >
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />

        {/* Only show PAUSED overlay if the game has actually been started */}
        {isPaused && !gameOver && isGameActive && (
          <div className={styles.overlayText}>PAUSED</div>
        )}

        {/* Only show Start message if game hasn't moved yet */}
        {!isGameActive && !gameOver && (
          <div className={styles.overlayText}>Press Arrow to Start</div>
        )}

        {gameOver && (
          <div className={styles.overlayText} style={{ color: "red" }}>
            GAME OVER
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={bgType}
          onChange={(e) => setBgType(e.target.value)}
        >
          <option value="sci">Sci-Fi</option>
          <option value="matrix">Matrix</option>
          <option value="space">Deep Space</option>
        </select>

        <button
          className={styles.button}
          onClick={() => setIsPaused(!isPaused)}
          // 1. Disable button if game hasn't started or is over
          disabled={!isGameActive || gameOver}
          style={{
            opacity: !isGameActive || gameOver ? 0.5 : 1,
            cursor: !isGameActive || gameOver ? "not-allowed" : "pointer",
          }}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button className={styles.button} onClick={resetGame}>
          Restart
        </button>
      </div>
    </div>
  );
};

export default SnakeGame;
