import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface FloatingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'star' | 'superstar' | 'coin';
  radius: number;
  collected: boolean;
}

interface StormHazard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'cloud' | 'drone';
  radius: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const StarCollectorGame: React.FC<Props> = ({ level, character, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [starsCollected, setStarsCollected] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 32);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);

  const gameState = useRef({
    x: 320,
    y: 170,
    vx: 0,
    vy: 0,
    speed: 5.2,
    frame: 0,
    lives: 3,
    invincibleTimer: 0,
    keys: { up: false, down: false, left: false, right: false },
    stars: [] as FloatingStar[],
    hazards: [] as StormHazard[],
    floatingTexts: [] as FloatingText[],
    totalStarsGoal: level.targetStarsScore >= 180 ? 15 : 10,
    collectedStars: 0,
    collectedCoins: 0,
    score: 0,
    isFinished: false,
  });

  // Spawn initial stars, coins & storm hazards
  useEffect(() => {
    const list: FloatingStar[] = [];
    const count = gameState.current.totalStarsGoal + 6;

    for (let i = 0; i < count; i++) {
      list.push({
        x: 60 + Math.random() * 520,
        y: 50 + Math.random() * 240,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
        type: i % 4 === 0 ? 'coin' : i % 7 === 0 ? 'superstar' : 'star',
        radius: i % 7 === 0 ? 16 : 12,
        collected: false,
      });
    }

    // Floating hazards (Storm clouds & drone mines)
    const haz: StormHazard[] = [
      { x: 120, y: 80, vx: 1.2, vy: 0.8, type: 'cloud', radius: 24 },
      { x: 500, y: 140, vx: -1.0, vy: 1.1, type: 'drone', radius: 20 },
      { x: 260, y: 260, vx: 1.1, vy: -0.9, type: 'cloud', radius: 24 },
      { x: 420, y: 70, vx: -0.9, vy: -1.0, type: 'drone', radius: 20 },
    ];

    gameState.current.stars = list;
    gameState.current.hazards = haz;
    gameState.current.floatingTexts = [];
    gameState.current.lives = 3;
    gameState.current.score = 0;
    gameState.current.collectedStars = 0;
    gameState.current.collectedCoins = 0;
    gameState.current.isFinished = false;
    setLives(3);
    setScore(0);
    setStarsCollected(0);
    setCoinsCollected(0);
    setTimeLeft(level.timeLimitSeconds || 32);
  }, [level]);

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (gameState.current.isFinished) return;
    gameState.current.isFinished = true;
    gameState.current.lives = 0;
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(100, Math.floor((gameState.current.collectedStars / gameState.current.totalStarsGoal) * 100));
    onGameOver('lives', gameState.current.score, pct);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = gameState.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setIsPaused((p) => !p);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = gameState.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Timer & Loop
  useEffect(() => {
    let animId: number;
    const timerId = window.setInterval(() => {
      if (!isPaused && !gameState.current.isFinished) {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0 && !gameState.current.isFinished) {
            gameState.current.isFinished = true;
            const s = gameState.current;
            const pct = Math.min(100, Math.floor((s.collectedStars / s.totalStarsGoal) * 100));

            if (s.collectedStars >= s.totalStarsGoal) {
              const earnedStars = calculateStars(s.score, level.targetStarsScore);
              sound.playVictory();
              try {
                confetti({ particleCount: 70, spread: 60 });
              } catch {}
              setTimeout(() => {
                onVictory(earnedStars, s.score, s.collectedCoins);
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

        if (s.invincibleTimer > 0) {
          s.invincibleTimer--;
        }

        // Velocity from keys
        if (s.keys.up) s.vy = -s.speed;
        else if (s.keys.down) s.vy = s.speed;
        else s.vy *= 0.82;

        if (s.keys.left) s.vx = -s.speed;
        else if (s.keys.right) s.vx = s.speed;
        else s.vx *= 0.82;

        s.x += s.vx;
        s.y += s.vy;

        // Keep inside bounds
        s.x = Math.max(30, Math.min(610, s.x));
        s.y = Math.max(40, Math.min(300, s.y));

        // Move stars gently & bounce inside screen
        s.stars.forEach((st) => {
          if (!st.collected) {
            st.x += st.vx;
            st.y += st.vy;
            if (st.x < 30 || st.x > 610) st.vx *= -1;
            if (st.y < 30 || st.y > 310) st.vy *= -1;

            // Check collision with player
            const dist = Math.hypot(st.x - s.x, st.y - s.y);
            if (dist < st.radius + 24) {
              st.collected = true;
              if (st.type === 'coin') {
                s.collectedCoins += 1;
                s.score += 15;
                sound.playCoin();
                setCoinsCollected(s.collectedCoins);
              } else {
                s.collectedStars += 1;
                s.score += st.type === 'superstar' ? 40 : 25;
                sound.playStar();
                setStarsCollected(s.collectedStars);

                // Check early win if collected target stars
                if (s.collectedStars >= s.totalStarsGoal && !s.isFinished) {
                  s.isFinished = true;
                  s.score += 50; // speed bonus
                  const earnedStars = calculateStars(s.score, level.targetStarsScore);
                  sound.playVictory();
                  try {
                    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                  } catch {}
                  setTimeout(() => {
                    onVictory(earnedStars, s.score, s.collectedCoins);
                  }, 1200);
                }
              }
              setScore(s.score);
            }
          }
        });

        // Move Hazards & check collision with player -> Deals 1 Heart Damage!
        s.hazards.forEach((hz) => {
          hz.x += hz.vx;
          hz.y += hz.vy;
          if (hz.x < 40 || hz.x > 600) hz.vx *= -1;
          if (hz.y < 40 || hz.y > 300) hz.vy *= -1;

          const dist = Math.hypot(hz.x - s.x, hz.y - s.y);
          if (dist < hz.radius + 20) {
            if (s.invincibleTimer <= 0) {
              s.lives -= 1;
              setLives(s.lives);
              s.invincibleTimer = 45;
              sound.playHit();
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 200);

              s.floatingTexts.push({
                x: s.x,
                y: s.y - 25,
                text: hz.type === 'cloud' ? '-1 ❤️ ZAP ⚡' : '-1 ❤️ MINE 💥',
                color: '#ef4444',
                alpha: 1.0,
              });

              // OUT / Game Over when 0 lives!
              if (s.lives <= 0 && !s.isFinished) {
                s.isFinished = true;
                sound.playGameOver();
                const pct = Math.min(100, Math.floor((s.collectedStars / s.totalStarsGoal) * 100));
                setTimeout(() => {
                  onGameOver('lives', s.score, pct);
                }, 600);
                return;
              }
            }
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

            // Twilight starry sky background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#1e1b4b');
            bgGrad.addColorStop(0.7, '#312e81');
            bgGrad.addColorStop(1, '#064e3b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Ambient background stars
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for (let i = 0; i < 30; i++) {
              const bgx = (i * 73 + s.frame * 0.1) % canvas.width;
              const bgy = (i * 37) % (canvas.height - 60);
              ctx.fillRect(bgx, bgy, 2, 2);
            }

            // Draw floating items
            s.stars.forEach((st) => {
              if (!st.collected) {
                if (st.type === 'coin') {
                  drawCoin(ctx, st.x, st.y, 11, s.frame);
                } else {
                  const pulse = Math.sin(s.frame * 0.1 + st.x) * 2;
                  drawStar(
                    ctx,
                    st.x,
                    st.y,
                    st.radius + pulse,
                    5,
                    st.type === 'superstar' ? '#f59e0b' : '#fde047'
                  );
                }
              }
            });

            // Draw Storm Hazards (Clouds & Mines)
            s.hazards.forEach((hz) => {
              if (hz.type === 'cloud') {
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.arc(hz.x - 10, hz.y, 16, 0, Math.PI * 2);
                ctx.arc(hz.x + 8, hz.y - 4, 18, 0, Math.PI * 2);
                ctx.arc(hz.x + 20, hz.y + 4, 14, 0, Math.PI * 2);
                ctx.fill();
                // Lightning bolt inside cloud
                ctx.fillStyle = '#fde047';
                ctx.font = '16px sans-serif';
                ctx.fillText('⚡', hz.x - 4, hz.y + 6);
              } else {
                // Drone mine
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(hz.x, hz.y, hz.radius - 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1e1b4b';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('⚠️', hz.x - 7, hz.y + 5);
              }
            });

            // Draw Player Cadet with Parachute
            const isFlickering = s.invincibleTimer > 0 && Math.floor(s.frame / 4) % 2 === 0;
            if (!isFlickering) {
              // Cute parachute overhead
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.arc(s.x, s.y - 32, 22, Math.PI, 0, false);
              ctx.fill();
              ctx.strokeStyle = '#e2e8f0';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(s.x - 20, s.y - 32);
              ctx.lineTo(s.x, s.y - 10);
              ctx.moveTo(s.x + 20, s.y - 32);
              ctx.lineTo(s.x, s.y - 10);
              ctx.stroke();

              drawCartoonSoldier(ctx, s.x, s.y, 1, character, 'jump', s.frame);
            }

            // Draw floating texts
            s.floatingTexts.forEach((ft) => {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.font = 'bold 15px sans-serif';
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x - 28, ft.y);
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
  }, [isPaused, character, level]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-indigo-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-indigo-900/90 border-2 border-indigo-600 rounded-2xl px-4 py-2 flex items-center justify-between shadow-lg text-white">
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
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">
              {starsCollected} / {gameState.current.totalStarsGoal}
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
            className="p-2 bg-indigo-800 hover:bg-indigo-700 active:scale-95 rounded-xl border border-indigo-600 cursor-pointer"
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
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-indigo-700/80 aspect-[16/9] object-contain bg-slate-900"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Sky Paused</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-indigo-800 flex items-center gap-2"
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

      {/* On-screen D-Pad Controls for Touch */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 pb-2">
        <div />
        <button
          onPointerDown={() => { gameState.current.keys.up = true; }}
          onPointerUp={() => { gameState.current.keys.up = false; }}
          onPointerLeave={() => { gameState.current.keys.up = false; }}
          className="py-3 bg-gradient-to-b from-indigo-600 to-indigo-800 active:from-indigo-700 active:to-indigo-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-indigo-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowUp size={24} />
        </button>
        <div />
        <button
          onPointerDown={() => { gameState.current.keys.left = true; }}
          onPointerUp={() => { gameState.current.keys.left = false; }}
          onPointerLeave={() => { gameState.current.keys.left = false; }}
          className="py-3 bg-gradient-to-b from-indigo-600 to-indigo-800 active:from-indigo-700 active:to-indigo-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-indigo-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onPointerDown={() => { gameState.current.keys.down = true; }}
          onPointerUp={() => { gameState.current.keys.down = false; }}
          onPointerLeave={() => { gameState.current.keys.down = false; }}
          className="py-3 bg-gradient-to-b from-indigo-600 to-indigo-800 active:from-indigo-700 active:to-indigo-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-indigo-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onPointerDown={() => { gameState.current.keys.right = true; }}
          onPointerUp={() => { gameState.current.keys.right = false; }}
          onPointerLeave={() => { gameState.current.keys.right = false; }}
          className="py-3 bg-gradient-to-b from-indigo-600 to-indigo-800 active:from-indigo-700 active:to-indigo-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-indigo-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
