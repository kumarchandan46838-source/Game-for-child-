import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonJeep, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X } from 'lucide-react';

interface Props {
  level: LevelConfig;
  vehicle: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onExit: () => void;
}

interface Obstacle {
  lane: number;
  y: number;
  type: 'mud' | 'cone' | 'rock';
  hit: boolean;
}

interface Pickup {
  lane: number;
  y: number;
  type: 'coin' | 'star' | 'fuel';
  collected: boolean;
}

export const JeepAdventureGame: React.FC<Props> = ({ level, vehicle, onVictory, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 35);
  const [progressPercent, setProgressPercent] = useState(0);

  const gameState = useRef({
    lane: 1, // 0: left, 1: center, 2: right
    targetLane: 1,
    jeepX: 320,
    jeepY: 250,
    speed: level.difficulty === 'Fun Challenge' ? 5.2 : level.difficulty === 'Medium' ? 4.2 : 3.4,
    roadOffset: 0,
    score: 0,
    coins: 0,
    stars: 0,
    fuel: 100,
    obstacles: [] as Obstacle[],
    pickups: [] as Pickup[],
    frame: 0,
    totalDuration: level.timeLimitSeconds || 35,
    elapsedSeconds: 0,
    isFinished: false,
  });

  const laneXCoordinates = [190, 320, 450];

  // Spawn obstacles & pickups
  useEffect(() => {
    const obs: Obstacle[] = [];
    const picks: Pickup[] = [];
    let curY = -200;
    const count = 35;

    for (let i = 0; i < count; i++) {
      curY -= 140 + Math.random() * 80;
      const obsLane = Math.floor(Math.random() * 3);
      const pickLane = (obsLane + 1 + Math.floor(Math.random() * 2)) % 3;

      obs.push({
        lane: obsLane,
        y: curY,
        type: i % 3 === 0 ? 'mud' : i % 3 === 1 ? 'cone' : 'rock',
        hit: false,
      });

      picks.push({
        lane: pickLane,
        y: curY + 40,
        type: i % 4 === 0 ? 'star' : i % 5 === 0 ? 'fuel' : 'coin',
        collected: false,
      });
    }

    gameState.current.obstacles = obs;
    gameState.current.pickups = picks;
  }, [level]);

  // Steer controls
  const steerLeft = () => {
    const s = gameState.current;
    if (s.targetLane > 0) {
      s.targetLane -= 1;
      sound.playJump();
    }
  };

  const steerRight = () => {
    const s = gameState.current;
    if (s.targetLane < 2) {
      s.targetLane += 1;
      sound.playJump();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        steerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        steerRight();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main game loop
  useEffect(() => {
    let animId: number;
    let timerId: number;

    timerId = window.setInterval(() => {
      if (!isPaused && !gameState.current.isFinished) {
        setTimeLeft((prev) => {
          const next = prev - 1;
          const s = gameState.current;
          s.elapsedSeconds = s.totalDuration - next;
          const pct = Math.min(100, Math.floor((s.elapsedSeconds / s.totalDuration) * 100));
          setProgressPercent(pct);

          if (next <= 0 && !s.isFinished) {
            s.isFinished = true;
            const earnedStars = calculateStars(s.score, level.targetStarsScore);
            sound.playVictory();
            try {
              confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
            } catch {}
            setTimeout(() => {
              onVictory(earnedStars, s.score, s.coins);
            }, 1200);
            return 0;
          }
          return next;
        });
      }
    }, 1000);

    const loop = () => {
      if (!isPaused && !gameState.current.isFinished) {
        const s = gameState.current;
        s.frame++;
        s.roadOffset = (s.roadOffset + s.speed) % 80;

        // Smooth lane interpolation
        const targetX = laneXCoordinates[s.targetLane];
        s.jeepX += (targetX - s.jeepX) * 0.18;

        // Move obstacles & pickups downwards toward the jeep
        s.obstacles.forEach((obs) => {
          obs.y += s.speed;
          const obsX = laneXCoordinates[obs.lane];
          // Check collision with jeep
          if (!obs.hit && Math.abs(obs.y - s.jeepY) < 30 && Math.abs(obsX - s.jeepX) < 35) {
            obs.hit = true;
            sound.playTryAgain();
            s.score = Math.max(0, s.score - 10);
            setScore(s.score);
          }
        });

        s.pickups.forEach((pick) => {
          pick.y += s.speed;
          const pickX = laneXCoordinates[pick.lane];
          if (!pick.collected && Math.abs(pick.y - s.jeepY) < 32 && Math.abs(pickX - s.jeepX) < 36) {
            pick.collected = true;
            if (pick.type === 'coin') {
              s.coins += 1;
              s.score += 15;
              sound.playCoin();
              setCoinsCollected(s.coins);
            } else if (pick.type === 'star') {
              s.stars += 1;
              s.score += 30;
              sound.playStar();
              setStarsCollected(s.stars);
            } else if (pick.type === 'fuel') {
              s.score += 20;
              sound.playCoin();
            }
            setScore(s.score);
          }
        });

        // Render Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Green Jungle Forest background
            ctx.fillStyle = '#166534';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Jungle trees on left and right borders
            ctx.fillStyle = '#14532d';
            for (let ty = -40; ty < canvas.height + 40; ty += 60) {
              const animY = (ty + s.roadOffset) % (canvas.height + 60);
              // Left trees
              ctx.beginPath();
              ctx.arc(45, animY, 35, 0, Math.PI * 2);
              ctx.fill();
              // Right trees
              ctx.beginPath();
              ctx.arc(canvas.width - 45, animY, 35, 0, Math.PI * 2);
              ctx.fill();
            }

            // Road / Bridge surface
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.roundRect(120, 0, 400, canvas.height, 0);
            ctx.fill();

            // Road borders (yellow safety curbs)
            ctx.fillStyle = '#eab308';
            ctx.fillRect(120, 0, 8, canvas.height);
            ctx.fillRect(512, 0, 8, canvas.height);

            // Lane Dividers (dashed white lines)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.setLineDash([24, 20]);
            ctx.lineDashOffset = -s.roadOffset;

            // Lane 1 divider
            ctx.beginPath();
            ctx.moveTo(255, 0);
            ctx.lineTo(255, canvas.height);
            ctx.stroke();

            // Lane 2 divider
            ctx.beginPath();
            ctx.moveTo(385, 0);
            ctx.lineTo(385, canvas.height);
            ctx.stroke();

            ctx.setLineDash([]); // reset

            // Draw Pickups
            s.pickups.forEach((pick) => {
              if (!pick.collected && pick.y > -50 && pick.y < canvas.height + 50) {
                const px = laneXCoordinates[pick.lane];
                if (pick.type === 'coin') {
                  drawCoin(ctx, px, pick.y, 12, s.frame);
                } else if (pick.type === 'star') {
                  drawStar(ctx, px, pick.y, 14, 5, '#facc15');
                } else if (pick.type === 'fuel') {
                  // Cartoon Fuel Jerrycan
                  ctx.fillStyle = '#ef4444';
                  ctx.beginPath();
                  ctx.roundRect(px - 10, pick.y - 12, 20, 24, 4);
                  ctx.fill();
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 10px sans-serif';
                  ctx.fillText('⚡', px - 5, pick.y + 4);
                }
              }
            });

            // Draw Obstacles
            s.obstacles.forEach((obs) => {
              if (obs.y > -50 && obs.y < canvas.height + 50) {
                const ox = laneXCoordinates[obs.lane];
                if (obs.type === 'mud') {
                  // Friendly Mud Puddle
                  ctx.fillStyle = '#78350f';
                  ctx.beginPath();
                  ctx.ellipse(ox, obs.y, 24, 12, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#92400e';
                  ctx.beginPath();
                  ctx.ellipse(ox - 3, obs.y - 2, 14, 6, 0, 0, Math.PI * 2);
                  ctx.fill();
                } else if (obs.type === 'cone') {
                  // Traffic Cone
                  ctx.fillStyle = '#f97316';
                  ctx.beginPath();
                  ctx.moveTo(ox, obs.y - 16);
                  ctx.lineTo(ox + 12, obs.y + 12);
                  ctx.lineTo(ox - 12, obs.y + 12);
                  ctx.closePath();
                  ctx.fill();
                  // White stripe
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(ox - 7, obs.y - 2, 14, 4);
                } else if (obs.type === 'rock') {
                  // Round friendly boulder
                  ctx.fillStyle = '#78716c';
                  ctx.beginPath();
                  ctx.arc(ox, obs.y, 15, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#a8a29e';
                  ctx.beginPath();
                  ctx.arc(ox - 4, obs.y - 4, 6, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            });

            // Draw Cartoon Jeep (top-down or 2.5D perspective)
            const bounce = Math.sin(s.frame * 0.3) * 2;
            drawCartoonJeep(ctx, s.jeepX, s.jeepY, 1, vehicle, s.frame * 0.1, bounce);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerId);
    };
  }, [isPaused, level, vehicle, onVictory]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-amber-950/90 border-2 border-amber-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
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
          <span className="text-xs font-semibold text-amber-200">Time Left: {timeLeft}s</span>
          <div className="w-full bg-amber-950 rounded-full h-3.5 border border-amber-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-green-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-amber-800 hover:bg-amber-700 active:scale-95 rounded-xl border border-amber-600"
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

      {/* Main Canvas */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-2">
        <canvas
          ref={canvasRef}
          width={640}
          height={340}
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-amber-700/80 aspect-[16/9] object-contain bg-emerald-900"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Adventure Paused</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2"
              >
                <Play size={22} /> Resume
              </button>
              <button
                onClick={() => {
                  setTimeLeft(level.timeLimitSeconds || 35);
                  gameState.current.score = 0;
                  gameState.current.coins = 0;
                  gameState.current.stars = 0;
                  gameState.current.isFinished = false;
                  setScore(0);
                  setCoinsCollected(0);
                  setStarsCollected(0);
                  setIsPaused(false);
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-emerald-800 flex items-center gap-2"
              >
                <RotateCcw size={22} /> Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch Steering Buttons */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 pb-2">
        <button
          onClick={steerLeft}
          className="py-4 bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-600 active:to-amber-800 text-white font-extrabold text-xl rounded-2xl shadow-xl border-b-4 border-amber-900 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          <ArrowLeft size={30} className="stroke-[3]" />
          STEER LEFT
        </button>
        <button
          onClick={steerRight}
          className="py-4 bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-600 active:to-amber-800 text-white font-extrabold text-xl rounded-2xl shadow-xl border-b-4 border-amber-900 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          STEER RIGHT
          <ArrowRight size={30} className="stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
