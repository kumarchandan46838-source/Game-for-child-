import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Pause, Play, RotateCcw, X, Crosshair, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  speedY: number;
  popped: boolean;
  type: 'balloon' | 'star' | 'bullseye' | 'bomb';
}

interface SplashEffect {
  x: number;
  y: number;
  frame: number;
  color: string;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const TargetPracticeGame: React.FC<Props> = ({ level, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 30);
  const [isPaused, setIsPaused] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);

  const goalTargets = level.id >= 16 ? 12 : 8;

  const gameState = useRef({
    reticleX: 320,
    reticleY: 170,
    targets: [] as Target[],
    splashes: [] as SplashEffect[],
    floatingTexts: [] as FloatingText[],
    frame: 0,
    popped: 0,
    score: 0,
    lives: 3,
    isFinished: false,
  });

  // Spawn friendly floating cartoon balloons + bomb hazard balloons
  useEffect(() => {
    const targets: Target[] = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    for (let i = 0; i < 22; i++) {
      const isBomb = i % 5 === 0;
      targets.push({
        id: i,
        x: 60 + Math.random() * 520,
        y: 350 + Math.random() * 550, // rise up from bottom
        radius: isBomb ? 25 : 22 + Math.random() * 8,
        color: isBomb ? '#ef4444' : colors[i % colors.length],
        speedY: level.difficulty === 'Fun Challenge' ? 1.6 + Math.random() * 0.8 : 1.2 + Math.random() * 0.6,
        popped: false,
        type: isBomb ? 'bomb' : i % 4 === 1 ? 'bullseye' : i % 4 === 2 ? 'star' : 'balloon',
      });
    }

    gameState.current.targets = targets;
    gameState.current.splashes = [];
    gameState.current.floatingTexts = [];
    gameState.current.popped = 0;
    gameState.current.score = 0;
    gameState.current.lives = 3;
    gameState.current.isFinished = false;
    setLives(3);
    setScore(0);
    setPoppedCount(0);
    setTimeLeft(level.timeLimitSeconds || 30);
  }, [level]);

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (gameState.current.isFinished) return;
    gameState.current.isFinished = true;
    gameState.current.lives = 0;
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(100, Math.floor((gameState.current.popped / goalTargets) * 100));
    onGameOver('lives', gameState.current.score, pct);
  };

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

          // Check if player hit a BOMB balloon!
          if (t.type === 'bomb') {
            s.lives -= 1;
            setLives(s.lives);
            sound.playHit();
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 200);

            s.splashes.push({ x: t.x, y: t.y, frame: 0, color: '#ef4444' });
            s.floatingTexts.push({
              x: t.x,
              y: t.y - 20,
              text: '-1 ❤️ BOOM! 💥',
              color: '#ef4444',
              alpha: 1.0,
            });

            // OUT / Game Over when 0 lives!
            if (s.lives <= 0 && !s.isFinished) {
              s.isFinished = true;
              sound.playGameOver();
              const pct = Math.min(100, Math.floor((s.popped / goalTargets) * 100));
              setTimeout(() => {
                onGameOver('lives', s.score, pct);
              }, 600);
              return;
            }
          } else {
            // Good target
            s.popped++;
            const pts = t.type === 'bullseye' ? 25 : t.type === 'star' ? 30 : 15;
            s.score += pts;
            setPoppedCount(s.popped);
            setScore(s.score);

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

        // Rise targets upward & recycle
        s.targets.forEach((t) => {
          if (!t.popped) {
            t.y -= t.speedY;
            t.x += Math.sin(s.frame * 0.05 + t.id) * 0.6;

            if (t.y < -40) {
              t.y = 360 + Math.random() * 80;
              t.x = 60 + Math.random() * 520;
            }
          }
        });

        // Update splashes
        s.splashes.forEach((sp) => {
          sp.frame++;
        });
        s.splashes = s.splashes.filter((sp) => sp.frame < 18);

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

            // Camp shooting range background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#fef3c7');
            bgGrad.addColorStop(0.7, '#fed7aa');
            bgGrad.addColorStop(1, '#15803d');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Wooden target posts in background
            ctx.fillStyle = '#78350f';
            ctx.fillRect(80, 180, 12, 160);
            ctx.fillRect(310, 160, 12, 180);
            ctx.fillRect(540, 180, 12, 160);

            // Draw balloons / targets
            s.targets.forEach((t) => {
              if (!t.popped) {
                if (t.type === 'bomb') {
                  // Danger Spiked Bomb Balloon
                  ctx.fillStyle = '#18181b';
                  ctx.beginPath();
                  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = '#ef4444';
                  ctx.lineWidth = 3;
                  ctx.stroke();

                  // Danger Skull icon
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 16px sans-serif';
                  ctx.fillText('💣', t.x - 8, t.y + 6);
                } else {
                  // Balloon body
                  ctx.fillStyle = t.color;
                  ctx.beginPath();
                  ctx.ellipse(t.x, t.y, t.radius, t.radius * 1.25, 0, 0, Math.PI * 2);
                  ctx.fill();

                  // Balloon knot & string
                  ctx.beginPath();
                  ctx.moveTo(t.x - 3, t.y + t.radius * 1.25);
                  ctx.lineTo(t.x + 3, t.y + t.radius * 1.25);
                  ctx.lineTo(t.x, t.y + t.radius * 1.25 + 5);
                  ctx.closePath();
                  ctx.fill();

                  ctx.strokeStyle = '#ffffff80';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.moveTo(t.x, t.y + t.radius * 1.25 + 5);
                  ctx.quadraticCurveTo(t.x + 6, t.y + t.radius * 1.25 + 15, t.x, t.y + t.radius * 1.25 + 24);
                  ctx.stroke();

                  // Target design inside
                  if (t.type === 'bullseye') {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, t.radius * 0.55, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, t.radius * 0.28, 0, Math.PI * 2);
                    ctx.fill();
                  } else if (t.type === 'star') {
                    ctx.fillStyle = '#fde047';
                    ctx.font = '16px sans-serif';
                    ctx.fillText('⭐', t.x - 8, t.y + 5);
                  }
                }
              }
            });

            // Draw Splashes
            s.splashes.forEach((sp) => {
              const radius = sp.frame * 2.8;
              ctx.strokeStyle = sp.color;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
              ctx.stroke();

              // Splash droplets
              for (let d = 0; d < 6; d++) {
                const angle = (d * Math.PI) / 3;
                const dropDist = radius + 6;
                const dx = sp.x + Math.cos(angle) * dropDist;
                const dy = sp.y + Math.sin(angle) * dropDist;
                ctx.fillStyle = sp.color;
                ctx.beginPath();
                ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            });

            // Draw floating texts
            s.floatingTexts.forEach((ft) => {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.font = 'bold 16px sans-serif';
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x - 30, ft.y);
              ctx.restore();
            });

            // Draw aiming crosshair reticle
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(s.reticleX, s.reticleY, 20, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(s.reticleX - 28, s.reticleY);
            ctx.lineTo(s.reticleX + 28, s.reticleY);
            ctx.moveTo(s.reticleX, s.reticleY - 28);
            ctx.lineTo(s.reticleX, s.reticleY + 28);
            ctx.stroke();

            // Center red dot
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(s.reticleX, s.reticleY, 4, 0, Math.PI * 2);
            ctx.fill();

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
  }, [isPaused, level]);

  // Click on canvas to shoot/splash
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-amber-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-amber-900/90 border-2 border-amber-600 rounded-2xl px-4 py-2 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-2.5">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1 bg-red-950/60 px-2.5 py-1 rounded-xl border border-red-500/50">
            {[1, 2, 3].map((heartIndex) => (
              <span
                key={heartIndex}
                className={`text-lg transition-all duration-300 ${
                  heartIndex <= lives ? 'scale-100 opacity-100' : 'scale-75 opacity-30 grayscale'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-lg text-amber-300">
              {poppedCount} / {goalTargets}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-sky-500/20 px-2.5 py-1 rounded-xl border border-sky-400/40">
            <span className="text-sm">⏳</span>
            <span className="font-bold text-sm text-sky-200">{timeLeft}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="p-2 bg-amber-800 hover:bg-amber-700 active:scale-95 rounded-xl border border-amber-600 cursor-pointer"
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
          onClick={handleCanvasClick}
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-amber-700/80 aspect-[16/9] object-contain bg-amber-200 cursor-crosshair"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Target Range Paused</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2"
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

      {/* Helper Bottom Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-amber-900/60 border border-amber-700 px-4 py-2.5 rounded-2xl text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <Crosshair size={18} className="text-amber-400" />
          <span>Tap balloons to pop them! Avoid 💣 bomb balloons or lose hearts!</span>
        </div>
        <button
          onClick={() => triggerSplash(gameState.current.reticleX, gameState.current.reticleY)}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-md border-b-2 border-amber-700 active:translate-y-0.5"
        >
          SPLASH!
        </button>
      </div>
    </div>
  );
};
