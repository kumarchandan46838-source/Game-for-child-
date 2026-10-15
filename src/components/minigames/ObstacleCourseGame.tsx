import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, X, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'bridge' | 'log' | 'trampoline';
}

interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'mud' | 'bramble';
  hit: boolean;
}

interface Collectible {
  x: number;
  y: number;
  type: 'star' | 'coin';
  collected: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const ObstacleCourseGame: React.FC<Props> = ({ level, character, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);

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
    hazards: [] as Hazard[],
    collectibles: [] as Collectible[],
    floatingTexts: [] as FloatingText[],
    finishX: 1800,
    isFinished: false,
  });

  // Construct training course platforms, hazards & items
  useEffect(() => {
    const plats: Platform[] = [
      { x: 0, y: 260, width: 220, height: 60, type: 'ground' },
      { x: 260, y: 250, width: 140, height: 20, type: 'bridge' },
      { x: 440, y: 230, width: 110, height: 20, type: 'log' },
      { x: 580, y: 260, width: 90, height: 20, type: 'trampoline' },
      { x: 720, y: 170, width: 150, height: 20, type: 'bridge' },
      { x: 920, y: 200, width: 120, height: 20, type: 'log' },
      { x: 1080, y: 240, width: 160, height: 20, type: 'bridge' },
      { x: 1280, y: 260, width: 90, height: 20, type: 'trampoline' },
      { x: 1420, y: 160, width: 160, height: 20, type: 'bridge' },
      { x: 1640, y: 250, width: 300, height: 80, type: 'ground' },
    ];

    // Hazards that deal 1 Heart damage if stepped on carelessly!
    const haz: Hazard[] = [
      { x: 320, y: 232, width: 26, height: 18, type: 'bramble', hit: false },
      { x: 480, y: 212, width: 24, height: 18, type: 'spike', hit: false },
      { x: 780, y: 152, width: 28, height: 18, type: 'bramble', hit: false },
      { x: 960, y: 182, width: 24, height: 18, type: 'spike', hit: false },
      { x: 1140, y: 222, width: 30, height: 18, type: 'mud', hit: false },
      { x: 1480, y: 142, width: 26, height: 18, type: 'spike', hit: false },
    ];

    const items: Collectible[] = [
      { x: 150, y: 220, type: 'coin', collected: false },
      { x: 290, y: 210, type: 'star', collected: false },
      { x: 450, y: 190, type: 'coin', collected: false },
      { x: 625, y: 110, type: 'star', collected: false }, // high over trampoline
      { x: 740, y: 130, type: 'star', collected: false },
      { x: 935, y: 160, type: 'coin', collected: false },
      { x: 1100, y: 200, type: 'coin', collected: false },
      { x: 1325, y: 90, type: 'star', collected: false },
      { x: 1440, y: 120, type: 'star', collected: false },
      { x: 1720, y: 210, type: 'star', collected: false },
    ];

    gameState.current.platforms = plats;
    gameState.current.hazards = haz;
    gameState.current.collectibles = items;
    gameState.current.floatingTexts = [];
    gameState.current.finishX = 1800;
    gameState.current.lives = 3;
    gameState.current.score = 0;
    gameState.current.coins = 0;
    gameState.current.stars = 0;
    gameState.current.isFinished = false;
    setLives(3);
    setScore(0);
  }, [level]);

  const handleJumpPress = () => {
    const s = gameState.current;
    if (s.isGrounded) {
      s.vy = -12.5;
      s.isGrounded = false;
      sound.playJump();
    }
  };

  // Immediate Game Over / Out trigger
  const triggerManualOut = () => {
    if (gameState.current.isFinished) return;
    gameState.current.isFinished = true;
    gameState.current.lives = 0;
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(100, Math.floor((gameState.current.x / gameState.current.finishX) * 100));
    onGameOver('lives', gameState.current.score, pct);
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
        if (s.keys.left) s.vx = -4.2;
        else if (s.keys.right) s.vx = 4.2;
        else s.vx *= 0.8;

        s.x += s.vx;
        s.x = Math.max(20, Math.min(s.finishX + 120, s.x));

        // Gravity physics
        s.y += s.vy;
        s.vy += 0.65; // gravity

        if (s.invincibleTimer > 0) {
          s.invincibleTimer--;
        }

        // Platform collision
        s.isGrounded = false;
        const playerFeetY = s.y + 24;
        const playerBottomBox = { left: s.x - 14, right: s.x + 14 };

        for (const plat of s.platforms) {
          const platRight = plat.x + plat.width;
          if (playerBottomBox.right > plat.x && playerBottomBox.left < platRight) {
            // Landing on top
            if (s.vy >= 0 && playerFeetY >= plat.y && playerFeetY <= plat.y + 18) {
              s.y = plat.y - 24;
              s.isGrounded = true;

              if (plat.type === 'trampoline') {
                s.vy = -16.5; // High spring bounce!
                s.isGrounded = false;
                sound.playJump();
              } else {
                s.vy = 0;
              }
              break;
            }
          }
        }

        // Hazard Collision Check (Spikes / Brambles / Mud)
        s.hazards.forEach((hz) => {
          if (!hz.hit && Math.abs(hz.x - s.x) < 22 && Math.abs(hz.y - s.y) < 26) {
            if (s.invincibleTimer <= 0) {
              hz.hit = true;
              s.lives -= 1;
              setLives(s.lives);
              s.invincibleTimer = 45;
              sound.playHit();
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 200);

              s.floatingTexts.push({
                x: s.x,
                y: s.y - 30,
                text: '-1 ❤️ OUCH!',
                color: '#ef4444',
                alpha: 1.0,
              });

              // OUT / Game Over when 0 lives!
              if (s.lives <= 0 && !s.isFinished) {
                s.isFinished = true;
                sound.playGameOver();
                const pct = Math.min(100, Math.floor((s.x / s.finishX) * 100));
                setTimeout(() => {
                  onGameOver('lives', s.score, pct);
                }, 600);
                return;
              }
            }
          }
        });

        // River water rescue fallback with 1 Heart Damage!
        if (s.y > 330) {
          s.lives -= 1;
          setLives(s.lives);
          sound.playHit();
          setDamageFlash(true);
          setTimeout(() => setDamageFlash(false), 200);

          s.floatingTexts.push({
            x: s.x,
            y: 200,
            text: '-1 ❤️ SPLASH!',
            color: '#38bdf8',
            alpha: 1.0,
          });

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

        // Update floating texts
        s.floatingTexts.forEach((ft) => {
          ft.y -= 1.2;
          ft.alpha -= 0.025;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => ft.alpha > 0);

        // Check Victory at finish line flagpole
        if (s.x >= s.finishX - 40 && !s.isFinished) {
          s.isFinished = true;
          s.score += 100;
          const earnedStars = calculateStars(s.score, level.targetStarsScore);

          if (earnedStars > 0) {
            sound.playVictory();
            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } catch {}
            setTimeout(() => {
              onVictory(earnedStars, s.score, s.coins);
            }, 1200);
          } else {
            // Reached finish line but failed to score enough stars -> GAME OVER!
            sound.playGameOver();
            setTimeout(() => {
              onGameOver('moves', s.score, 100);
            }, 600);
          }
          return;
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

            // Sky & Clouds
            const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGrad.addColorStop(0, '#7dd3fc');
            skyGrad.addColorStop(0.7, '#bae6fd');
            skyGrad.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Fluffy clouds in background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            for (let i = 0; i < 5; i++) {
              const cloudX = ((i * 380) - s.cameraX * 0.3) % (canvas.width + 200) - 50;
              const cloudY = 40 + (i % 3) * 25;
              ctx.beginPath();
              ctx.arc(cloudX, cloudY, 24, 0, Math.PI * 2);
              ctx.arc(cloudX + 25, cloudY - 10, 30, 0, Math.PI * 2);
              ctx.arc(cloudX + 50, cloudY, 22, 0, Math.PI * 2);
              ctx.fill();
            }

            // Distant green hills
            ctx.fillStyle = '#86efac';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let hx = 0; hx <= canvas.width + 50; hx += 80) {
              const worldHx = hx + s.cameraX * 0.2;
              const hillY = 240 + Math.sin(worldHx * 0.008) * 35;
              ctx.lineTo(hx, hillY);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();

            // Rushing River at bottom (Fail zone)
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(0, 310, canvas.width, 30);
            ctx.fillStyle = '#0284c7';
            for (let rx = 0; rx < canvas.width; rx += 40) {
              const waveY = 310 + Math.sin((rx + s.frame * 4) * 0.08) * 3;
              ctx.fillRect(rx, waveY, 25, 4);
            }

            ctx.save();
            ctx.translate(-s.cameraX, 0);

            // Draw Platforms
            s.platforms.forEach((plat) => {
              if (plat.type === 'ground') {
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(plat.x, plat.y, plat.width, 14);
                ctx.fillStyle = '#78350f';
                ctx.fillRect(plat.x, plat.y + 14, plat.width, plat.height - 14);
              } else if (plat.type === 'bridge') {
                ctx.fillStyle = '#b45309';
                ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
                // wood slats
                ctx.fillStyle = '#78350f';
                for (let sx = plat.x + 8; sx < plat.x + plat.width; sx += 16) {
                  ctx.fillRect(sx, plat.y, 2, plat.height);
                }
              } else if (plat.type === 'log') {
                ctx.fillStyle = '#92400e';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
                ctx.fill();
              } else if (plat.type === 'trampoline') {
                ctx.fillStyle = '#e11d48';
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y + 4, plat.width, plat.height - 4, 6);
                ctx.fill();
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(plat.x + 10, plat.y, plat.width - 20, 6);
                // trampoline legs
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(plat.x + 12, plat.y + plat.height);
                ctx.lineTo(plat.x + 4, plat.y + plat.height + 25);
                ctx.moveTo(plat.x + plat.width - 12, plat.y + plat.height);
                ctx.lineTo(plat.x + plat.width - 4, plat.y + plat.height + 25);
                ctx.stroke();
              }
            });

            // Draw Hazards
            s.hazards.forEach((hz) => {
              if (!hz.hit) {
                if (hz.type === 'spike') {
                  ctx.fillStyle = '#dc2626';
                  ctx.beginPath();
                  ctx.moveTo(hz.x, hz.y);
                  ctx.lineTo(hz.x + 8, hz.y - 14);
                  ctx.lineTo(hz.x + 16, hz.y);
                  ctx.fill();
                } else if (hz.type === 'mud') {
                  ctx.fillStyle = '#78350f';
                  ctx.beginPath();
                  ctx.ellipse(hz.x + 10, hz.y, 16, 6, 0, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  ctx.fillStyle = '#15803d';
                  ctx.font = '16px sans-serif';
                  ctx.fillText('🌵', hz.x, hz.y);
                }
              }
            });

            // Draw Collectibles
            s.collectibles.forEach((item) => {
              if (!item.collected) {
                if (item.type === 'star') {
                  drawStar(ctx, item.x, item.y, 14, 5, '#fbbf24');
                } else {
                  drawCoin(ctx, item.x, item.y, 12, s.frame);
                }
              }
            });

            // Finish Line Flagpole
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(s.finishX, 120, 8, 140);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(s.finishX + 8, 125);
            ctx.lineTo(s.finishX + 50, 145);
            ctx.lineTo(s.finishX + 8, 165);
            ctx.closePath();
            ctx.fill();
            ctx.font = '14px sans-serif';
            ctx.fillText('⭐ FINISH', s.finishX - 10, 110);

            // Draw Cadet Character
            const isFlickering = s.invincibleTimer > 0 && Math.floor(s.frame / 4) % 2 === 0;
            if (!isFlickering) {
              const playerAction = !s.isGrounded ? 'jump' : s.vx !== 0 ? 'run' : 'idle';
              drawCartoonSoldier(ctx, s.x, s.y, 1, character, playerAction, s.frame);
            }

            // Draw floating texts
            s.floatingTexts.forEach((ft) => {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.font = 'bold 16px sans-serif';
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x - 25, ft.y);
              ctx.restore();
            });

            ctx.restore();

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
    return () => cancelAnimationFrame(animId);
  }, [isPaused, character, level]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-teal-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-teal-900/90 border-2 border-teal-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
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
          <div className="w-20 sm:w-28 bg-stone-900/80 rounded-full h-3.5 p-0.5 border border-teal-500 hidden sm:block">
            <div
              className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
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
            className="p-2 bg-teal-800 hover:bg-teal-700 active:scale-95 rounded-xl border border-teal-600 cursor-pointer"
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
          className="w-full h-auto max-h-[360px] rounded-2xl shadow-2xl border-4 border-teal-700/80 aspect-[16/9] object-contain bg-sky-300"
        />

        {isPaused && (
          <div className="absolute inset-0 bg-teal-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="text-3xl font-extrabold text-amber-300">Course Paused</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg border-b-4 border-teal-800 flex items-center gap-2"
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
