import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, X } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves', score: number, progressPct: number) => void;
  onExit: () => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'bridge' | 'log' | 'trampoline';
}

interface Collectible {
  x: number;
  y: number;
  type: 'star' | 'coin';
  collected: boolean;
}

export const ObstacleCourseGame: React.FC<Props> = ({ level, character, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const gameState = useRef({
    x: 60,
    y: 200,
    vx: 0,
    vy: 0,
    cameraX: 0,
    isGrounded: false,
    frame: 0,
    score: 0,
    coins: 0,
    stars: 0,
    lives: 3,
    invincibleTimer: 0,
    keys: { left: false, right: false, jump: false },
    platforms: [] as Platform[],
    collectibles: [] as Collectible[],
    finishX: 1800,
    isFinished: false,
  });

  // Construct training course platforms & items
  useEffect(() => {
    const plats: Platform[] = [
      { x: 0, y: 260, width: 220, height: 60, type: 'ground' },
      { x: 260, y: 250, width: 140, height: 20, type: 'bridge' },
      { x: 440, y: 230, width: 100, height: 20, type: 'log' },
      { x: 580, y: 260, width: 90, height: 20, type: 'trampoline' },
      { x: 720, y: 170, width: 150, height: 20, type: 'bridge' },
      { x: 920, y: 200, width: 110, height: 20, type: 'log' },
      { x: 1080, y: 240, width: 160, height: 20, type: 'bridge' },
      { x: 1280, y: 260, width: 90, height: 20, type: 'trampoline' },
      { x: 1420, y: 160, width: 160, height: 20, type: 'bridge' },
      { x: 1640, y: 250, width: 300, height: 80, type: 'ground' },
    ];

    const items: Collectible[] = [
      { x: 150, y: 220, type: 'coin', collected: false },
      { x: 330, y: 210, type: 'star', collected: false },
      { x: 490, y: 190, type: 'coin', collected: false },
      { x: 625, y: 110, type: 'star', collected: false }, // high over trampoline
      { x: 790, y: 130, type: 'star', collected: false },
      { x: 975, y: 160, type: 'coin', collected: false },
      { x: 1160, y: 200, type: 'coin', collected: false },
      { x: 1325, y: 90, type: 'star', collected: false },
      { x: 1500, y: 120, type: 'star', collected: false },
    ];

    gameState.current.platforms = plats;
    gameState.current.collectibles = items;
    gameState.current.finishX = 1800;
  }, [level]);

  const handleJumpPress = () => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -12.5;
      s.isGrounded = false;
      sound.playJump();
    }
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = gameState.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJumpPress();
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setIsPaused((p) => !p);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = gameState.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isPaused && !gameState.current.isFinished) {
        const s = gameState.current;
        s.frame++;

        // Horizontal movement
        const moveSpeed = 4.2;
        if (s.keys.right) s.vx = moveSpeed;
        else if (s.keys.left) s.vx = -moveSpeed;
        else s.vx *= 0.8; // friction

        s.x += s.vx;

        // Apply Gravity
        s.vy += 0.62;
        s.y += s.vy;

        // Platform collision checks
        s.isGrounded = false;
        const playerFootY = s.y + 24;
        const playerFootX = s.x;

        for (const plat of s.platforms) {
          if (
            playerFootX >= plat.x - 12 &&
            playerFootX <= plat.x + plat.width + 12 &&
            s.vy >= 0 &&
            playerFootY >= plat.y &&
            playerFootY <= plat.y + 16
          ) {
            s.y = plat.y - 24;
            s.isGrounded = true;

            if (plat.type === 'trampoline') {
              // Bouncy trampoline launching high!
              s.vy = -16.5;
              s.isGrounded = false;
              sound.playJump();
            } else {
              s.vy = 0;
            }
            break;
          }
        }

        // River water rescue fallback with 1 Heart Damage!
        if (s.y > 330) {
          s.lives -= 1;
          setLives(s.lives);
          sound.playHit();

          if (s.lives <= 0 && !s.isFinished) {
            s.isFinished = true;
            sound.playGameOver();
            const pct = Math.min(100, Math.floor((s.x / s.finishX) * 100));
            setTimeout(() => {
              onGameOver('lives', s.score, pct);
            }, 600);
            return;
          }

          s.x = Math.max(60, s.x - 220);
          s.y = 180;
          s.vy = 0;
          s.invincibleTimer = 40;
        }

        // Progress calculation
        const pct = Math.min(100, Math.floor((s.x / s.finishX) * 100));
        setProgressPercent(pct);

        // Collectibles check
        s.collectibles.forEach((item) => {
          if (!item.collected && Math.abs(item.x - s.x) < 28 && Math.abs(item.y - s.y) < 32) {
            item.collected = true;
            if (item.type === 'coin') {
              s.coins += 1;
              s.score += 15;
              sound.playCoin();
              setCoinsCollected(s.coins);
            } else {
              s.stars += 1;
              s.score += 30;
              sound.playStar();
              setStarsCollected(s.stars);
            }
            setScore(s.score);
          }
        });

        // Check Victory at finish line flagpole
        if (s.x >= s.finishX - 40 && !s.isFinished) {
          s.isFinished = true;
          s.score += 100;
          const earnedStars = calculateStars(s.score, level.targetStarsScore);
          sound.playVictory();
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch {}
          setTimeout(() => {
            onVictory(earnedStars, s.score, s.coins);
          }, 1200);
        }

        // Smooth camera follow
        const targetCamX = Math.max(0, s.x - 240);
        s.cameraX += (targetCamX - s.cameraX) * 0.12;

        // Render Canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sky & Jungle background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#0284c7');
            bgGrad.addColorStop(0.6, '#7dd3fc');
            bgGrad.addColorStop(1, '#065f46');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Water at bottom
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(0, 280, canvas.width, 60);
            ctx.fillStyle = '#38bdf8';
            for (let wx = 0; wx < canvas.width; wx += 40) {
              const waveY = Math.sin((wx + s.frame * 2) * 0.05) * 4;
              ctx.fillRect(wx, 280 + waveY, 20, 3);
            }

            ctx.save();
            ctx.translate(-s.cameraX, 0);

            // Draw Platforms
            s.platforms.forEach((plat) => {
              if (plat.type === 'ground') {
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
                ctx.fill();
                ctx.fillStyle = '#713f12';
                ctx.fillRect(plat.x, plat.y + 12, plat.width, plat.height - 12);
              } else if (plat.type === 'bridge') {
                // Wooden rope bridge planks
                ctx.fillStyle = '#a16207';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 4);
                ctx.fill();
                // Rope railings
                ctx.strokeStyle = '#ca8a04';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(plat.x, plat.y - 12);
                ctx.lineTo(plat.x + plat.width, plat.y - 12);
                ctx.stroke();
              } else if (plat.type === 'log') {
                // Floating log
                ctx.fillStyle = '#854d0e';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
                ctx.fill();
              } else if (plat.type === 'trampoline') {
                // Bouncy red cushion trampoline
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(plat.x + 8, plat.y + 4, plat.width - 16, 4);
              }
            });

            // Draw Collectibles
            s.collectibles.forEach((item) => {
              if (!item.collected) {
                if (item.type === 'coin') {
                  drawCoin(ctx, item.x, item.y, 11, s.frame);
                } else {
                  drawStar(ctx, item.x, item.y, 13, 5, '#facc15');
                }
              }
            });

            // Draw Finish Flag
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(s.finishX, 170, 8, 90);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(s.finishX + 8, 170);
            ctx.lineTo(s.finishX + 50, 190);
            ctx.lineTo(s.finishX + 8, 210);
            ctx.fill();
            drawStar(ctx, s.finishX + 26, 190, 7, 5, '#ffffff');

            // Draw Soldier (with flicker when damaged)
            const action = !s.isGrounded ? 'jump' : Math.abs(s.vx) > 0.5 ? 'run' : 'idle';
            if (s.invincibleTimer <= 0 || s.invincibleTimer % 6 < 3) {
              drawCartoonSoldier(ctx, s.x, s.y, 1, character, action, s.frame);
            }

            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, level, character, onVictory, onGameOver]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-teal-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-teal-900/90 border-2 border-teal-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3 Lives / Hearts */}
          <div className="flex items-center gap-1 bg-red-950/60 px-2.5 py-1 rounded-xl border border-red-500/60">
            {[1, 2, 3].map((heartIdx) => (
              <span
                key={heartIdx}
                className={`text-lg transition-transform ${
                  heartIdx <= lives ? 'scale-100 text-rose-500' : 'scale-90 opacity-30 grayscale'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/30 px-2.5 py-1 rounded-xl border border-amber-400">
            <span className="text-base sm:text-lg">⭐</span>
            <span className="font-bold text-sm sm:text-base text-amber-300">{starsCollected}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/30 px-2.5 py-1 rounded-xl border border-yellow-400">
            <span className="text-base sm:text-lg">🪙</span>
            <span className="font-bold text-sm sm:text-base text-yellow-300">{coinsCollected}</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-[160px] mx-2">
          <span className="text-xs font-semibold text-teal-200">Course: {progressPercent}%</span>
          <div className="w-full bg-teal-950 rounded-full h-3.5 border border-teal-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-teal-400 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-teal-800 hover:bg-teal-700 active:scale-95 rounded-xl border border-teal-600"
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
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-teal-700/80 aspect-[16/9] object-contain bg-sky-300"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-teal-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Course Paused</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-teal-800 flex items-center gap-2"
              >
                <Play size={22} /> Resume
              </button>
              <button
                onClick={() => {
                  gameState.current.x = 60;
                  gameState.current.y = 200;
                  gameState.current.vx = 0;
                  gameState.current.vy = 0;
                  gameState.current.score = 0;
                  gameState.current.coins = 0;
                  gameState.current.stars = 0;
                  gameState.current.isFinished = false;
                  setScore(0);
                  setCoinsCollected(0);
                  setStarsCollected(0);
                  setIsPaused(false);
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2"
              >
                <RotateCcw size={22} /> Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch Controls (Left, Right, Jump) */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-3 pb-2">
        <button
          onPointerDown={() => { gameState.current.keys.left = true; }}
          onPointerUp={() => { gameState.current.keys.left = false; }}
          onPointerLeave={() => { gameState.current.keys.left = false; }}
          className="py-4 bg-gradient-to-b from-teal-600 to-teal-800 active:from-teal-700 active:to-teal-900 text-white font-extrabold text-lg rounded-2xl shadow-xl border-b-4 border-teal-950 flex items-center justify-center gap-1 active:translate-y-1 active:border-b-0"
        >
          <ArrowLeft size={28} className="stroke-[3]" /> LEFT
        </button>
        <button
          onPointerDown={() => { gameState.current.keys.right = true; }}
          onPointerUp={() => { gameState.current.keys.right = false; }}
          onPointerLeave={() => { gameState.current.keys.right = false; }}
          className="py-4 bg-gradient-to-b from-teal-600 to-teal-800 active:from-teal-700 active:to-teal-900 text-white font-extrabold text-lg rounded-2xl shadow-xl border-b-4 border-teal-950 flex items-center justify-center gap-1 active:translate-y-1 active:border-b-0"
        >
          RIGHT <ArrowRight size={28} className="stroke-[3]" />
        </button>
        <button
          onClick={handleJumpPress}
          className="py-4 bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-600 active:to-amber-800 text-white font-extrabold text-lg rounded-2xl shadow-xl border-b-4 border-amber-950 flex items-center justify-center gap-1 active:translate-y-1 active:border-b-0"
        >
          <ArrowUp size={28} className="stroke-[3]" /> JUMP!
        </button>
      </div>
    </div>
  );
};
