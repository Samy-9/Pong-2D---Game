import React, { useEffect, useRef, useState } from 'react';

interface GameState {
  playerY: number;
  computerY: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  playerScore: number;
  computerScore: number;
  keys: {
    ArrowUp: boolean;
    ArrowDown: boolean;
  };
  ballTrail: Array<{ x: number; y: number; opacity: number }>;
  isPlayerServe: boolean;
  isServing: boolean;
}

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const CANVAS_HEIGHT = 400;
const CANVAS_WIDTH = 800;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 5;
const SPEED_INCREASE = 1.15;
const MAX_BALL_SPEED = 15;
const TRAIL_LENGTH = 10;

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    computerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: PADDLE_WIDTH * 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: 0,
    ballSpeedY: 0,
    playerScore: 0,
    computerScore: 0,
    keys: {
      ArrowUp: false,
      ArrowDown: false
    },
    ballTrail: [],
    isPlayerServe: true,
    isServing: true
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setGameState(prev => ({
          ...prev,
          keys: {
            ...prev.keys,
            [e.key]: true
          }
        }));
      } else if (e.key === ' ') {
        e.preventDefault();
        setGameState(prev => {
          if (!prev.isServing || !prev.isPlayerServe) return prev;
          
          const speed = INITIAL_BALL_SPEED;
          const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
          
          return {
            ...prev,
            ballSpeedX: speed,
            ballSpeedY: Math.sin(angle) * speed,
            isServing: false
          };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setGameState(prev => ({
          ...prev,
          keys: {
            ...prev.keys,
            [e.key]: false
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        let newState = { ...prev };

        // Update ball trail
        newState.ballTrail = [
          { x: newState.ballX, y: newState.ballY, opacity: 1 },
          ...newState.ballTrail
            .slice(0, TRAIL_LENGTH - 1)
            .map((pos, index) => ({
              ...pos,
              opacity: 1 - (index + 1) / TRAIL_LENGTH
            }))
        ];

        // Handle player movement
        if (newState.keys.ArrowUp) {
          newState.playerY = Math.max(0, newState.playerY - PADDLE_SPEED);
        }
        if (newState.keys.ArrowDown) {
          newState.playerY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newState.playerY + PADDLE_SPEED);
        }

        if (newState.isServing) {
          // Position the ball at the serving player's paddle
          if (newState.isPlayerServe) {
            newState.ballX = PADDLE_WIDTH * 2;
            newState.ballY = newState.playerY + PADDLE_HEIGHT / 2;
          } else {
            newState.ballX = CANVAS_WIDTH - PADDLE_WIDTH * 3;
            newState.ballY = newState.computerY + PADDLE_HEIGHT / 2;
            
            // Auto-serve for computer after a short delay
            if (!newState.ballSpeedX && !newState.ballSpeedY) {
              setTimeout(() => {
                setGameState(prev => {
                  const speed = INITIAL_BALL_SPEED;
                  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
                  return {
                    ...prev,
                    ballSpeedX: -speed,
                    ballSpeedY: Math.sin(angle) * speed,
                    isServing: false
                  };
                });
              }, 1000);
            }
          }
        } else {
          // Move ball
          newState.ballX += newState.ballSpeedX;
          newState.ballY += newState.ballSpeedY;
        }

        // Ball collision with top and bottom
        if (newState.ballY <= 0 || newState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
          newState.ballSpeedY = -newState.ballSpeedY * 1.05;
          newState.ballSpeedY = Math.min(Math.max(newState.ballSpeedY, -MAX_BALL_SPEED), MAX_BALL_SPEED);
        }

        // Ball collision with paddles
        if (
          newState.ballX <= PADDLE_WIDTH &&
          newState.ballY >= newState.playerY &&
          newState.ballY <= newState.playerY + PADDLE_HEIGHT
        ) {
          const relativeIntersectY = (newState.playerY + (PADDLE_HEIGHT / 2)) - newState.ballY;
          const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
          const bounceAngle = normalizedIntersectY * Math.PI / 3;
          
          const speed = Math.sqrt(newState.ballSpeedX * newState.ballSpeedX + newState.ballSpeedY * newState.ballSpeedY);
          const newSpeed = Math.min(speed * SPEED_INCREASE, MAX_BALL_SPEED);
          
          newState.ballSpeedX = Math.cos(bounceAngle) * newSpeed;
          newState.ballSpeedY = -Math.sin(bounceAngle) * newSpeed;
          
          new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==').play().catch(() => {});
        }

        if (
          newState.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
          newState.ballY >= newState.computerY &&
          newState.ballY <= newState.computerY + PADDLE_HEIGHT
        ) {
          const relativeIntersectY = (newState.computerY + (PADDLE_HEIGHT / 2)) - newState.ballY;
          const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
          const bounceAngle = normalizedIntersectY * Math.PI / 3;
          
          const speed = Math.sqrt(newState.ballSpeedX * newState.ballSpeedX + newState.ballSpeedY * newState.ballSpeedY);
          const newSpeed = Math.min(speed * SPEED_INCREASE, MAX_BALL_SPEED);
          
          newState.ballSpeedX = -Math.cos(bounceAngle) * newSpeed;
          newState.ballSpeedY = -Math.sin(bounceAngle) * newSpeed;
          
          new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==').play().catch(() => {});
        }

        // Score points
        if (newState.ballX <= 0) {
          newState.computerScore++;
          newState = resetBall(newState, false); // Computer serves next
        }
        if (newState.ballX >= CANVAS_WIDTH) {
          newState.playerScore++;
          newState = resetBall(newState, true); // Player serves next
        }

        // Computer AI movement
        const computerCenter = newState.computerY + PADDLE_HEIGHT / 2;
        const ballCenter = newState.ballY + BALL_SIZE / 2;
        
        let predictedY = ballCenter;
        if (newState.ballSpeedX > 0) {
          const timeToIntercept = (CANVAS_WIDTH - PADDLE_WIDTH - newState.ballX) / newState.ballSpeedX;
          predictedY = newState.ballY + newState.ballSpeedY * timeToIntercept;
          predictedY = Math.min(Math.max(predictedY, 0), CANVAS_HEIGHT);
        }
        
        if (computerCenter < predictedY - 2) {
          newState.computerY = Math.min(
            CANVAS_HEIGHT - PADDLE_HEIGHT,
            newState.computerY + PADDLE_SPEED * 0.85
          );
        }
        if (computerCenter > predictedY + 2) {
          newState.computerY = Math.max(0, newState.computerY - PADDLE_SPEED * 0.85);
        }

        return newState;
      });
    }, 1000 / 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(gameLoop);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear canvas
    context.fillStyle = '#000000';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    context.setLineDash([5, 15]);
    context.beginPath();
    context.moveTo(CANVAS_WIDTH / 2, 0);
    context.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    context.strokeStyle = '#FFFFFF';
    context.stroke();

    // Draw ball trail
    gameState.ballTrail.forEach((pos) => {
      context.fillStyle = `rgba(255, 255, 255, ${pos.opacity * 0.3})`;
      context.fillRect(pos.x, pos.y, BALL_SIZE, BALL_SIZE);
    });

    // Draw paddles
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    context.fillRect(
      CANVAS_WIDTH - PADDLE_WIDTH,
      gameState.computerY,
      PADDLE_WIDTH,
      PADDLE_HEIGHT
    );

    // Draw ball
    context.fillStyle = '#FFFFFF';
    context.fillRect(gameState.ballX, gameState.ballY, BALL_SIZE, BALL_SIZE);

    // Draw scores
    context.font = '32px "Press Start 2P", monospace';
    context.fillText(gameState.playerScore.toString(), CANVAS_WIDTH / 4, 50);
    context.fillText(
      gameState.computerScore.toString(),
      (3 * CANVAS_WIDTH) / 4,
      50
    );

    // Draw serve instructions
    if (gameState.isServing && gameState.isPlayerServe) {
      context.font = '16px "Press Start 2P", monospace';
      context.fillText('Appuyez sur ESPACE pour servir', CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 20);
    }
  }, [gameState]);

  const resetBall = (state: GameState, isPlayerServe: boolean): GameState => {
    return {
      ...state,
      ballX: isPlayerServe ? PADDLE_WIDTH * 2 : CANVAS_WIDTH - PADDLE_WIDTH * 3,
      ballY: isPlayerServe ? state.playerY + PADDLE_HEIGHT / 2 : state.computerY + PADDLE_HEIGHT / 2,
      ballSpeedX: 0,
      ballSpeedY: 0,
      ballTrail: [],
      isPlayerServe,
      isServing: true
    };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-white">Pong Rétro</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-white rounded"
      />
      <p className="text-white text-sm">
        Utilisez les flèches ↑ et ↓ pour déplacer votre raquette
        {gameState.isServing && gameState.isPlayerServe && (
          <span> et ESPACE pour servir</span>
        )}
      </p>
    </div>
  );
};

export default PongGame;