import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, Pause, Play, RotateCcw, X } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onExit: () => void;
}

interface Obstacle {
  x: number;
  type: 'puddle' | 'log' | 'branch';
  width: number;
  height: number;
  passed: boolean;
}

interface Item {
  x: number;
  y: number;
  type: 'coin' | 'star';
  collected: boolean;
}

export const ArmyRunnerGame: React.FC<Props> = ({ level, character, onVictory, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const gameState = useRef({
    distance: 0,
    maxDistance: (level.obstacleCount || 6) * 350 + 800,
    speed: level.difficulty === 'Fun Challenge' ? 4.5 : level.difficulty === 'Medium' ? 3.8 : 3.0,
    playerX: 100,
    playerY: 230,
    groundY: 230,
    vy: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    frame: 0,
    score: 0,
    coins: 0,
    stars: 0,
    obstacles: [] as Obstacle[],
    items: [] as Item[],
    isFinished: false,
  });

  // Spawn obstacles and items according to level
  useEffect(() => {
    const obs: Obstacle[] = [];
    const items: Item[] = [];
    const count = level.obstacleCount || 6;
    let currX = 500;

    for (let i = 0; i < count; i++) {
      currX += 280 + Math.random() * 120;
      const type = (level.id >= 9 && Math.random() > 0.6) ? 'branch' : (i % 2 === 0 ? 'puddle' : 'log');
      obs.push({
        x: currX,
        type,
        width: type === 'puddle' ? 46 : type === 'log' ? 34 : 40,
        height: type === 'puddle' ? 14 : type === 'log' ? 28 : 20,
        passed: false,
      });

      // Item in between
      items.push({
        x: currX - 120,
        y: 200,
        type: i % 2 === 0 ? 'coin' : 'star',
        collected: false,
      });

      // Item over obstacle
      items.push({
        x: currX,
        y: type === 'branch' ? 240 : 150, // Jump to get star over log, slide to get coin under branch
        type: 'star',
        collected: false,
      });
    }

    // Victory flag at the end
    gameState.current.obstacles = obs;
    gameState.current.items = items;
    gameState.current.maxDistance = currX + 300;
  }, [level]);

  // Jump handler
  const handleJump = () => {
    const s = gameState.current;
    if (s.isGrounded && !s.isSliding) {
      s.vy = -12.5;
      s.isGrounded = false;
      sound.playJump();
    }
  };

  // Slide handler
  const handleSlide = () => {
    const s = gameState.current;
    if (s.isGrounded && !s.isSliding) {
      s.isSliding = true;
      s.slideTimer = 26; // frames
      sound.playJump();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSlide();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60fps game loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isPaused && !isGameOver) {
        const s = gameState.current;
        s.frame++;
        s.distance += s.speed;

        // Progress calculation
        const pct = Math.min(100, Math.floor((s.distance / s.maxDistance) * 100));
        setProgressPercent(pct);

        // Physics
        if (!s.isGrounded) {
          s.playerY += s.vy;
          s.vy += 0.65; // gravity
          if (s.playerY >= s.groundY) {
            s.playerY = s.groundY;
            s.vy = 0;
            s.isGrounded = true;
          }
        }

        if (s.isSliding) {
          s.slideTimer--;
          if (s.slideTimer <= 0) {
            s.isSliding = false;
          }
        }

        // Check Items collection
        s.items.forEach((item) => {
          if (!item.collected) {
            const screenX = item.x - s.distance + s.playerX;
            if (Math.abs(screenX - s.playerX) < 32 && Math.abs(item.y - s.playerY) < 40) {
              item.collected = true;
              if (item.type === 'coin') {
                s.coins += 1;
                s.score += 15;
                sound.playCoin();
                setCoinsCollected(s.coins);
              } else {
                s.stars += 1;
                s.score += 25;
                sound.playStar();
                setStarsCollected(s.stars);
              }
              setScore(s.score);
            }
          }
        });

        // Check Obstacles collision (harmless stumble/points reduction in kid-friendly mode!)
        s.obstacles.forEach((obs) => {
          const screenX = obs.x - s.distance + s.playerX;
          if (!obs.passed && Math.abs(screenX - s.playerX) < 30) {
            let hit = false;
            if (obs.type === 'puddle' || obs.type === 'log') {
              if (s.playerY >= s.groundY - 10) {
                hit = true;
              }
            } else if (obs.type === 'branch') {
              if (!s.isSliding) {
                hit = true;
              }
            }

            if (hit) {
              obs.passed = true;
              sound.playTryAgain();
              s.score = Math.max(0, s.score - 10);
              setScore(s.score);
            }
          }
        });

        // Check Level Win condition
        if (s.distance >= s.maxDistance && !s.isFinished) {
          s.isFinished = true;
          setIsGameOver(true);
          const earnedStars = calculateStars(s.score, level.targetStarsScore);
          sound.playVictory();
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setTimeout(() => {
            onVictory(earnedStars, s.score, s.coins);
          }, 1200);
        }

        // Render Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sky gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGrad.addColorStop(0, '#38bdf8');
            skyGrad.addColorStop(0.6, '#bae6fd');
            skyGrad.addColorStop(0.61, '#4ade80');
            skyGrad.addColorStop(1, '#15803d');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Distant hills (parallax)
            ctx.fillStyle = '#86efac';
            ctx.beginPath();
            ctx.arc(160 - (s.distance * 0.1) % 500, 260, 150, Math.PI, 0);
            ctx.arc(460 - (s.distance * 0.1) % 500, 260, 180, Math.PI, 0);
            ctx.arc(760 - (s.distance * 0.1) % 500, 260, 140, Math.PI, 0);
            ctx.fill();

            // Clouds
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            const cloudX = (s.frame * 0.4) % (canvas.width + 100);
            ctx.beginPath();
            ctx.arc(canvas.width - cloudX, 50, 24, 0, Math.PI * 2);
            ctx.arc(canvas.width - cloudX + 24, 45, 30, 0, Math.PI * 2);
            ctx.arc(canvas.width - cloudX + 50, 52, 22, 0, Math.PI * 2);
            ctx.fill();

            // Ground & track line
            ctx.fillStyle = '#a16207';
            ctx.fillRect(0, s.groundY + 28, canvas.width, 100);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(0, s.groundY + 24, canvas.width, 6);

            // Draw Obstacles
            s.obstacles.forEach((obs) => {
              const ox = obs.x - s.distance + s.playerX;
              if (ox > -100 && ox < canvas.width + 100) {
                if (obs.type === 'puddle') {
                  // Harmless cartoon mud splash puddle
                  ctx.fillStyle = '#78350f';
                  ctx.beginPath();
                  ctx.ellipse(ox, s.groundY + 28, 22, 6, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#92400e';
                  ctx.beginPath();
                  ctx.ellipse(ox - 3, s.groundY + 27, 14, 4, 0, 0, Math.PI * 2);
                  ctx.fill();
                } else if (obs.type === 'log') {
                  // Cartoon wooden log
                  ctx.fillStyle = '#713f12';
                  ctx.beginPath();
                  ctx.roundRect(ox - 14, s.groundY + 8, 28, 20, 6);
                  ctx.fill();
                  ctx.fillStyle = '#a16207';
                  ctx.beginPath();
                  ctx.arc(ox - 14, s.groundY + 18, 6, 0, Math.PI * 2);
                  ctx.fill();
                } else if (obs.type === 'branch') {
                  // Low hanging canopy branch with friendly leaves
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(ox - 30, s.groundY - 34, 60, 10);
                  ctx.fillStyle = '#16a34a';
                  ctx.beginPath();
                  ctx.arc(ox - 15, s.groundY - 30, 12, 0, Math.PI * 2);
                  ctx.arc(ox + 15, s.groundY - 30, 14, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            });

            // Draw Items (coins & stars)
            s.items.forEach((item) => {
              if (!item.collected) {
                const ix = item.x - s.distance + s.playerX;
                if (ix > -50 && ix < canvas.width + 50) {
                  if (item.type === 'coin') {
                    drawCoin(ctx, ix, item.y, 11, s.frame);
                  } else {
                    drawStar(ctx, ix, item.y, 12, 5, '#facc15');
                  }
                }
              }
            });

            // Finish Line Flag
            const finishX = s.maxDistance - s.distance + s.playerX;
            if (finishX > -50 && finishX < canvas.width + 100) {
              // Flagpole
              ctx.fillStyle = '#e2e8f0';
              ctx.fillRect(finishX, s.groundY - 60, 6, 90);
              // Checkered gold flag
              ctx.fillStyle = '#eab308';
              ctx.beginPath();
              ctx.moveTo(finishX + 6, s.groundY - 60);
              ctx.lineTo(finishX + 46, s.groundY - 45);
              ctx.lineTo(finishX + 6, s.groundY - 30);
              ctx.fill();
              drawStar(ctx, finishX + 24, s.groundY - 45, 6, 5, '#ffffff');
            }

            // Draw Character
            const playerAction = s.isSliding ? 'slide' : !s.isGrounded ? 'jump' : 'run';
            drawCartoonSoldier(ctx, s.playerX, s.playerY, 1, character, playerAction, s.frame);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, isGameOver, level, character, onVictory]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">{starsCollected}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/30 px-3 py-1 rounded-xl border border-yellow-400">
            <span className="text-xl">🪙</span>
            <span className="font-bold text-lg text-yellow-300">{coinsCollected}</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-[160px] mx-2">
          <span className="text-xs font-semibold text-emerald-200">Course Progress</span>
          <div className="w-full bg-emerald-950 rounded-full h-3.5 border border-emerald-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-xl border border-emerald-600"
            aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-red-700/80 hover:bg-red-600 active:scale-95 rounded-xl border border-red-500"
            aria-label="Exit Game"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-2">
        <canvas
          ref={canvasRef}
          width={640}
          height={340}
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-emerald-700/80 aspect-[16/9] object-contain bg-sky-300"
        />

        {/* Pause Modal */}
        {isPaused && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Game Paused</h3>
            <p className="text-emerald-200 text-sm">{level.name}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-emerald-800 flex items-center gap-2 active:translate-y-1"
              >
                <Play size={22} /> Resume
              </button>
              <button
                onClick={() => {
                  gameState.current.distance = 0;
                  gameState.current.score = 0;
                  gameState.current.coins = 0;
                  gameState.current.stars = 0;
                  gameState.current.isFinished = false;
                  setScore(0);
                  setCoinsCollected(0);
                  setStarsCollected(0);
                  setIsPaused(false);
                  setIsGameOver(false);
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2 active:translate-y-1"
              >
                <RotateCcw size={22} /> Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Big Child-Friendly Touch Controls */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 pb-2">
        <button
          onClick={handleSlide}
          className="py-4 bg-gradient-to-b from-teal-500 to-teal-700 active:from-teal-600 active:to-teal-800 text-white font-extrabold text-xl rounded-2xl shadow-xl border-b-4 border-teal-900 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          <ArrowDown size={28} className="stroke-[3]" />
          SLIDE / DUCK
        </button>
        <button
          onClick={handleJump}
          className="py-4 bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-600 active:to-amber-800 text-white font-extrabold text-xl rounded-2xl shadow-xl border-b-4 border-amber-900 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          <ArrowUp size={28} className="stroke-[3]" />
          JUMP!
        </button>
      </div>
    </div>
  );
};
