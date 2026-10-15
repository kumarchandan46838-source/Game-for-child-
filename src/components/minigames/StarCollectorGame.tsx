import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onExit: () => void;
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

export const StarCollectorGame: React.FC<Props> = ({ level, character, onVictory, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [starsCollected, setStarsCollected] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 35);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  const gameState = useRef({
    x: 320,
    y: 170,
    vx: 0,
    vy: 0,
    speed: 5.0,
    frame: 0,
    keys: { up: false, down: false, left: false, right: false },
    stars: [] as FloatingStar[],
    totalStarsGoal: level.targetStarsScore >= 180 ? 16 : 10,
    collectedStars: 0,
    collectedCoins: 0,
    score: 0,
    isFinished: false,
  });

  // Spawn initial stars & coins
  useEffect(() => {
    const list: FloatingStar[] = [];
    const count = gameState.current.totalStarsGoal + 6;

    for (let i = 0; i < count; i++) {
      list.push({
        x: 60 + Math.random() * 520,
        y: 50 + Math.random() * 240,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        type: i % 4 === 0 ? 'coin' : i % 7 === 0 ? 'superstar' : 'star',
        radius: i % 7 === 0 ? 16 : 12,
        collected: false,
      });
    }
    gameState.current.stars = list;
  }, [level]);

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
            const earnedStars = calculateStars(gameState.current.score, level.targetStarsScore);
            sound.playVictory();
            try {
              confetti({ particleCount: 70, spread: 60 });
            } catch {}
            setTimeout(() => {
              onVictory(earnedStars, gameState.current.score, gameState.current.collectedCoins);
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
              const bgx = ((i * 73) + s.frame * 0.1) % canvas.width;
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
                    st.type === 'superstar' ? '#f59e0b' : '#facc15'
                  );
                }
              }
            });

            // Draw Cadet with spinning mini-copter backpack
            // Spinning mini blades above cadet
            ctx.save();
            ctx.translate(s.x, s.y - 28);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-2, 0, 4, 12);
            // Rotor
            const bladeWidth = Math.cos(s.frame * 0.8) * 32;
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.abs(bladeWidth), 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            drawCartoonSoldier(ctx, s.x, s.y, 1, character, 'jump', s.frame);
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
  }, [isPaused, level, character, onVictory]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-yellow-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-amber-900/90 border-2 border-amber-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">
              {starsCollected} / {gameState.current.totalStarsGoal}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/30 px-3 py-1 rounded-xl border border-yellow-400">
            <span className="text-xl">🪙</span>
            <span className="font-bold text-lg text-yellow-300">{coinsCollected}</span>
          </div>
        </div>

        <div className="text-center font-bold text-amber-200">
          ⏳ {timeLeft}s
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
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-amber-700/80 aspect-[16/9] object-contain bg-indigo-950"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-yellow-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Mission Paused</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2"
              >
                <Play size={22} /> Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch D-Pad Controls for Kids */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2 pb-2">
        <div />
        <button
          onPointerDown={() => { gameState.current.keys.up = true; }}
          onPointerUp={() => { gameState.current.keys.up = false; }}
          onPointerLeave={() => { gameState.current.keys.up = false; }}
          className="py-3 bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-amber-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowUp size={24} />
        </button>
        <div />

        <button
          onPointerDown={() => { gameState.current.keys.left = true; }}
          onPointerUp={() => { gameState.current.keys.left = false; }}
          onPointerLeave={() => { gameState.current.keys.left = false; }}
          className="py-3 bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-amber-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onPointerDown={() => { gameState.current.keys.down = true; }}
          onPointerUp={() => { gameState.current.keys.down = false; }}
          onPointerLeave={() => { gameState.current.keys.down = false; }}
          className="py-3 bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-amber-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onPointerDown={() => { gameState.current.keys.right = true; }}
          onPointerUp={() => { gameState.current.keys.right = false; }}
          onPointerLeave={() => { gameState.current.keys.right = false; }}
          className="py-3 bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-amber-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
