import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonJeep, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  vehicle: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const JeepAdventureGame: React.FC<Props> = ({ level, vehicle, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 35);
  const [progressPercent, setProgressPercent] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);

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
    lives: 3,
    invincibleTimer: 0,
    fuel: 100,
    obstacles: [] as Obstacle[],
    pickups: [] as Pickup[],
    floatingTexts: [] as FloatingText[],
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
    gameState.current.floatingTexts = [];
    gameState.current.lane = 1;
    gameState.current.targetLane = 1;
    gameState.current.jeepX = 320;
    gameState.current.score = 0;
    gameState.current.coins = 0;
    gameState.current.stars = 0;
    gameState.current.lives = 3;
    gameState.current.elapsedSeconds = 0;
    gameState.current.isFinished = false;
    setLives(3);
    setScore(0);
    setCoinsCollected(0);
    setStarsCollected(0);
    setTimeLeft(level.timeLimitSeconds || 35);
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

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (gameState.current.isFinished) return;
    gameState.current.isFinished = true;
    gameState.current.lives = 0;
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(100, Math.floor((gameState.current.elapsedSeconds / gameState.current.totalDuration) * 100));
    onGameOver('crashed', gameState.current.score, pct);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        steerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
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
            if (s.score >= level.targetStarsScore) {
              const earnedStars = calculateStars(s.score, level.targetStarsScore);
              sound.playVictory();
              try {
                confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
              } catch {}
              setTimeout(() => {
                onVictory(earnedStars, s.score, s.coins);
              }, 1200);
            } else {
              // Failed to reach required score in time -> GAME OVER!
              sound.playGameOver();
              setTimeout(() => {
                onGameOver('timeout', s.score, pct);
              }, 600);
            }
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

        if (s.invincibleTimer > 0) {
          s.invincibleTimer--;
        }

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
            if (s.invincibleTimer <= 0) {
              s.lives -= 1;
              setLives(s.lives);
              s.invincibleTimer = 45;
              sound.playHit();
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 200);

              s.floatingTexts.push({
                x: s.jeepX,
                y: s.jeepY - 30,
                text: '-1 ❤️ CRASH! 💥',
                color: '#ef4444',
                alpha: 1.0,
              });

              // Check OUT / GAME OVER condition
              if (s.lives <= 0 && !s.isFinished) {
                s.isFinished = true;
                sound.playGameOver();
                const pct = Math.min(100, Math.floor((s.elapsedSeconds / s.totalDuration) * 100));
                setTimeout(() => {
                  onGameOver('crashed', s.score, pct);
                }, 600);
                return;
              }
            }
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

        // Update floating texts
        s.floatingTexts.forEach((ft) => {
          ft.y -= 1.0;
          ft.alpha -= 0.025;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => ft.alpha > 0);

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

            // Road edges
            ctx.fillStyle = '#eab308';
            ctx.fillRect(120, 0, 8, canvas.height);
            ctx.fillRect(512, 0, 8, canvas.height);

            // Dashed Lane dividers
            ctx.strokeStyle = '#f5f5f4';
            ctx.lineWidth = 4;
            ctx.setLineDash([20, 20]);
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
            ctx.setLineDash([]); // Reset dash

            // Draw Pickups (Stars, Coins, Fuel)
            s.pickups.forEach((pick) => {
              if (!pick.collected && pick.y > -30 && pick.y < canvas.height + 30) {
                const px = laneXCoordinates[pick.lane];
                if (pick.type === 'coin') {
                  drawCoin(ctx, px, pick.y, 12, s.frame);
                } else if (pick.type === 'star') {
                  drawStar(ctx, px, pick.y, 14, 5, '#fbbf24');
                } else {
                  // Fuel can
                  ctx.fillStyle = '#dc2626';
                  ctx.beginPath();
                  ctx.roundRect(px - 10, pick.y - 12, 20, 24, 4);
                  ctx.fill();
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 10px sans-serif';
                  ctx.fillText('⛽', px - 6, pick.y + 4);
                }
              }
            });

            // Draw Obstacles (Mud, Cones, Rocks)
            s.obstacles.forEach((obs) => {
              if (obs.y > -40 && obs.y < canvas.height + 40) {
                const ox = laneXCoordinates[obs.lane];
                if (obs.type === 'mud') {
                  ctx.fillStyle = '#78350f';
                  ctx.beginPath();
                  ctx.ellipse(ox, obs.y, 24, 14, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#451a03';
                  ctx.font = '14px sans-serif';
                  ctx.fillText('💧', ox - 7, obs.y + 5);
                } else if (obs.type === 'cone') {
                  ctx.fillStyle = '#ea580c';
                  ctx.beginPath();
                  ctx.moveTo(ox, obs.y - 16);
                  ctx.lineTo(ox - 12, obs.y + 12);
                  ctx.lineTo(ox + 12, obs.y + 12);
                  ctx.closePath();
                  ctx.fill();
                  // White stripes on cone
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(ox - 6, obs.y - 2, 12, 4);
                } else {
                  // Rock boulder
                  ctx.fillStyle = '#57534e';
                  ctx.beginPath();
                  ctx.ellipse(ox, obs.y, 18, 14, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#78716c';
                  ctx.beginPath();
                  ctx.arc(ox - 4, obs.y - 4, 8, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            });

            // Draw Jeep Player
            const isFlickering = s.invincibleTimer > 0 && Math.floor(s.frame / 4) % 2 === 0;
            if (!isFlickering) {
              drawCartoonJeep(ctx, s.jeepX, s.jeepY, 1, vehicle);
            }

            // Draw floating texts
            s.floatingTexts.forEach((ft) => {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.font = 'bold 16px sans-serif';
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x - 30, ft.y);
              ctx.restore();
            });

            // Red Damage Flash overlay
            if (damageFlash) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
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
  }, [isPaused, level, vehicle]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1 bg-red-950/60 px-3 py-1 rounded-xl border border-red-500/50">
            {[1, 2, 3].map((heartIndex) => (
              <span
                key={heartIndex}
                className={`text-xl transition-all duration-300 ${
                  heartIndex <= lives ? 'scale-100 opacity-100' : 'scale-75 opacity-30 grayscale'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">{score}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-yellow-500/20 px-2.5 py-1 rounded-xl border border-yellow-400/40">
            <span className="text-sm">🪙</span>
            <span className="font-bold text-sm text-yellow-200">{coinsCollected}</span>
          </div>
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-sky-500/20 px-2.5 py-1 rounded-xl border border-sky-400/40">
            <span className="text-sm">⏳</span>
            <span className="font-bold text-sm text-sky-200">{timeLeft}s</span>
          </div>

          {/* Direct OUT / Game Over Test button */}
          <button
            onClick={triggerManualOut}
            title="आउट टेस्ट (Test Game Over)"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/90 hover:bg-red-500 active:scale-95 rounded-xl border border-red-400 text-xs font-black shadow-md cursor-pointer text-white"
          >
            <Skull size={15} />
            <span className="hidden xs:inline">OUT</span>
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-xl border border-emerald-600 cursor-pointer"
            aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-red-700/80 hover:bg-red-600 active:scale-95 rounded-xl border border-red-500 cursor-pointer"
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
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-emerald-700/80 aspect-[16/9] object-contain bg-emerald-900"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Adventure Paused</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-emerald-800 flex items-center gap-2"
              >
                <Play size={20} /> Resume
              </button>
              <button
                onClick={triggerManualOut}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-red-800 flex items-center gap-2"
              >
                <Skull size={20} /> Give Up / Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch Steering Controls */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 pb-2">
        <button
          onClick={steerLeft}
          className="py-4 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold text-lg rounded-2xl shadow-xl border-b-4 border-emerald-950 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          <ArrowLeft size={28} className="stroke-[3]" /> STEER LEFT
        </button>
        <button
          onClick={steerRight}
          className="py-4 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold text-lg rounded-2xl shadow-xl border-b-4 border-emerald-950 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          STEER RIGHT <ArrowRight size={28} className="stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
