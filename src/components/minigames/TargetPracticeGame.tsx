import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Pause, Play, RotateCcw, X, Crosshair } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves', score: number, progressPct: number) => void;
  onExit: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  speedY: number;
  popped: boolean;
  type: 'balloon' | 'star' | 'bullseye';
}

interface SplashEffect {
  x: number;
  y: number;
  frame: number;
  color: string;
}

export const TargetPracticeGame: React.FC<Props> = ({ level, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 30);
  const [isPaused, setIsPaused] = useState(false);

  const goalTargets = level.id >= 16 ? 12 : 8;

  const gameState = useRef({
    reticleX: 320,
    reticleY: 170,
    targets: [] as Target[],
    splashes: [] as SplashEffect[],
    frame: 0,
    popped: 0,
    score: 0,
    isFinished: false,
  });

  // Spawn friendly floating cartoon balloons
  useEffect(() => {
    const targets: Target[] = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    for (let i = 0; i < 18; i++) {
      targets.push({
        id: i,
        x: 60 + Math.random() * 520,
        y: 350 + Math.random() * 400, // rise up from bottom
        radius: 22 + Math.random() * 8,
        color: colors[i % colors.length],
        speedY: level.difficulty === 'Fun Challenge' ? 1.6 + Math.random() * 0.8 : 1.1 + Math.random() * 0.6,
        popped: false,
        type: i % 4 === 0 ? 'bullseye' : i % 5 === 0 ? 'star' : 'balloon',
      });
    }

    gameState.current.targets = targets;
    gameState.current.popped = 0;
    gameState.current.score = 0;
    gameState.current.isFinished = false;
  }, [level]);

  // Launch splash at coordinates
  const triggerSplash = (x: number, y: number) => {
    if (gameState.current.isFinished || isPaused) return;
    const s = gameState.current;

    sound.playPop();

    // Check target hit
    let hitAny = false;
    s.targets.forEach((t) => {
      if (!t.popped) {
        const dist = Math.hypot(t.x - x, t.y - y);
        if (dist <= t.radius + 15) {
          t.popped = true;
          hitAny = true;
          s.popped++;
          const pts = t.type === 'bullseye' ? 25 : t.type === 'star' ? 30 : 15;
          s.score += pts;
          setPoppedCount(s.popped);
          setScore(s.score);

          // Add splash animation
          s.splashes.push({ x: t.x, y: t.y, frame: 0, color: t.color });

          // Check win
          if (s.popped >= goalTargets && !s.isFinished) {
            s.isFinished = true;
            s.score += 50; // victory bonus
            const earnedStars = calculateStars(s.score, level.targetStarsScore);
            sound.playVictory();
            try {
              confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
            } catch {}
            setTimeout(() => {
              onVictory(earnedStars, s.score, 25);
            }, 1200);
          }
        }
      }
    });

    if (!hitAny) {
      s.splashes.push({ x, y, frame: 0, color: '#38bdf8' });
    }
  };

  // Keyboard navigation & space to pop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = gameState.current;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        triggerSplash(s.reticleX, s.reticleY);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        s.reticleY = Math.max(30, s.reticleY - 24);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        s.reticleY = Math.min(310, s.reticleY + 24);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        s.reticleX = Math.max(30, s.reticleX - 24);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        s.reticleX = Math.min(610, s.reticleX + 24);
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);

  // Main game loop & timer
  useEffect(() => {
    let animId: number;
    const timerId = window.setInterval(() => {
      if (!isPaused && !gameState.current.isFinished) {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0 && !gameState.current.isFinished) {
            gameState.current.isFinished = true;
            const s = gameState.current;
            const pct = Math.min(100, Math.floor((s.popped / goalTargets) * 100));

            if (s.popped >= goalTargets) {
              const earnedStars = calculateStars(s.score, level.targetStarsScore);
              sound.playVictory();
              try {
                confetti({ particleCount: 70, spread: 60 });
              } catch {}
              setTimeout(() => {
                onVictory(earnedStars, s.score, 20);
              }, 1200);
            } else {
              // Out of time -> GAME OVER!
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

        // Float balloons upward
        s.targets.forEach((t) => {
          if (!t.popped) {
            t.y -= t.speedY;
            t.x += Math.sin((s.frame + t.id * 20) * 0.05) * 0.6; // gentle sway

            // Recycle if float off top
            if (t.y < -40) {
              t.y = 360 + Math.random() * 80;
              t.x = 60 + Math.random() * 520;
            }
          }
        });

        // Advance splashes
        s.splashes.forEach((sp) => sp.frame++);
        s.splashes = s.splashes.filter((sp) => sp.frame < 18);

        // Render Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sunny carnival range sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGrad.addColorStop(0, '#fde047');
            skyGrad.addColorStop(0.5, '#fb923c');
            skyGrad.addColorStop(1, '#059669');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Carnival striped tents in background
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.moveTo(40, 260);
            ctx.lineTo(140, 160);
            ctx.lineTo(240, 260);
            ctx.fill();
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.moveTo(380, 260);
            ctx.lineTo(480, 160);
            ctx.lineTo(580, 260);
            ctx.fill();

            // Wooden barrier fence
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0, 280, canvas.width, 60);
            ctx.fillStyle = '#a16207';
            ctx.fillRect(0, 276, canvas.width, 8);

            // Draw Targets
            s.targets.forEach((t) => {
              if (!t.popped && t.y > -30 && t.y < canvas.height + 30) {
                if (t.type === 'balloon') {
                  // Cartoon smiling balloon
                  ctx.fillStyle = t.color;
                  ctx.beginPath();
                  ctx.ellipse(t.x, t.y, t.radius * 0.85, t.radius, 0, 0, Math.PI * 2);
                  ctx.fill();
                  // Balloon knot
                  ctx.beginPath();
                  ctx.moveTo(t.x - 3, t.y + t.radius);
                  ctx.lineTo(t.x + 3, t.y + t.radius);
                  ctx.lineTo(t.x, t.y + t.radius + 5);
                  ctx.fill();
                  // String
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(t.x, t.y + t.radius + 5);
                  ctx.quadraticCurveTo(t.x + 6, t.y + t.radius + 15, t.x, t.y + t.radius + 25);
                  ctx.stroke();

                  // Smiling face on balloon
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.arc(t.x - 6, t.y - 4, 3, 0, Math.PI * 2);
                  ctx.arc(t.x + 6, t.y - 4, 3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#0f172a';
                  ctx.beginPath();
                  ctx.arc(t.x - 6, t.y - 4, 1.5, 0, Math.PI * 2);
                  ctx.arc(t.x + 6, t.y - 4, 1.5, 0, Math.PI * 2);
                  ctx.fill();
                  // Smile
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.arc(t.x, t.y + 2, 5, 0.2, Math.PI - 0.2);
                  ctx.stroke();
                } else if (t.type === 'bullseye') {
                  // Non-violent friendly concentric rings
                  ctx.fillStyle = '#ef4444';
                  ctx.beginPath();
                  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.arc(t.x, t.y, t.radius * 0.65, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#ef4444';
                  ctx.beginPath();
                  ctx.arc(t.x, t.y, t.radius * 0.35, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  // Star target
                  ctx.fillStyle = '#eab308';
                  ctx.beginPath();
                  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 16px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('⭐', t.x, t.y);
                }
              }
            });

            // Draw Splash particles
            s.splashes.forEach((sp) => {
              const radius = sp.frame * 2.5;
              ctx.fillStyle = sp.color;
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const px = sp.x + Math.cos(angle) * radius;
                const py = sp.y + Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(px, py, Math.max(1, 6 - sp.frame * 0.3), 0, Math.PI * 2);
                ctx.fill();
              }
            });

            // Reticle / Crosshair
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(s.reticleX, s.reticleY, 20, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(s.reticleX - 26, s.reticleY);
            ctx.lineTo(s.reticleX - 8, s.reticleY);
            ctx.moveTo(s.reticleX + 8, s.reticleY);
            ctx.lineTo(s.reticleX + 26, s.reticleY);
            ctx.moveTo(s.reticleX, s.reticleY - 26);
            ctx.lineTo(s.reticleX, s.reticleY - 8);
            ctx.moveTo(s.reticleX, s.reticleY + 8);
            ctx.lineTo(s.reticleX, s.reticleY + 26);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(s.reticleX, s.reticleY, 3, 0, Math.PI * 2);
            ctx.fill();
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
  }, [isPaused, level, onVictory]);

  const handleCanvasTouch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    gameState.current.reticleX = clickX;
    gameState.current.reticleY = clickY;
    triggerSplash(clickX, clickY);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-rose-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-rose-900/90 border-2 border-rose-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">🎈</span>
            <span className="font-bold text-lg text-amber-300">
              {poppedCount} / {goalTargets} Popped
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-500/30 px-3 py-1 rounded-xl border border-rose-400">
            <span className="text-sm font-semibold text-rose-200">Score:</span>
            <span className="font-bold text-lg text-white">{score}</span>
          </div>
        </div>

        <div className="text-center font-bold text-amber-200">
          ⏳ {timeLeft}s
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-rose-800 hover:bg-rose-700 active:scale-95 rounded-xl border border-rose-600"
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

      {/* Main Canvas (Tap anywhere to splash balloon!) */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-2 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={640}
          height={340}
          onPointerDown={handleCanvasTouch}
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-rose-700/80 aspect-[16/9] object-contain bg-amber-200"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Practice Paused</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-rose-800 flex items-center gap-2"
              >
                <Play size={22} /> Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kid-friendly big Splash / Tap prompt button */}
      <div className="w-full max-w-md pb-2">
        <button
          onClick={() => triggerSplash(gameState.current.reticleX, gameState.current.reticleY)}
          className="w-full py-4 bg-gradient-to-b from-rose-500 to-rose-700 active:from-rose-600 active:to-rose-800 text-white font-extrabold text-xl rounded-2xl shadow-xl border-b-4 border-rose-900 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
        >
          <Crosshair size={28} /> TAP ANY BALLOON OR PRESS HERE TO SPLASH!
        </button>
      </div>
    </div>
  );
};
