import React, { useEffect, useRef, useState } from 'react';
import { LevelConfig } from '../../types/game';
import { drawCartoonSoldier, drawStar, drawCoin } from '../../utils/drawHelpers';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, Pause, Play, RotateCcw, X, HeartCrack, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  character: string;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface Obstacle {
  x: number;
  type: 'puddle' | 'log' | 'branch' | 'crate';
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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const ArmyRunnerGame: React.FC<Props> = ({ level, character, onVictory, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);

  const gameState = useRef({
    distance: 0,
    maxDistance: 2400,
    speed: level.difficulty === 'Fun Challenge' ? 4.6 : level.difficulty === 'Medium' ? 3.8 : 3.2,
    playerX: 110,
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
    lives: 3,
    invincibleTimer: 0,
    obstacles: [] as Obstacle[],
    items: [] as Item[],
    floatingTexts: [] as FloatingText[],
    isFinished: false,
  });

  // Spawn obstacles and items according to level
  useEffect(() => {
    const obs: Obstacle[] = [];
    const items: Item[] = [];
    // Ensure sufficient obstacles (8 to 14) so the player can actually get OUT if they do not dodge!
    const baseCount = Math.max(8, (level.obstacleCount || 6) + 3);
    let currX = 420;

    for (let i = 0; i < baseCount; i++) {
      currX += 210 + Math.random() * 80;
      const typeRand = Math.random();
      let type: 'puddle' | 'log' | 'branch' | 'crate' = 'puddle';

      if (level.id >= 9) {
        if (typeRand < 0.28) type = 'puddle';
        else if (typeRand < 0.55) type = 'log';
        else if (typeRand < 0.8) type = 'branch';
        else type = 'crate';
      } else {
        if (typeRand < 0.45) type = 'puddle';
        else if (typeRand < 0.8) type = 'log';
        else type = 'branch';
      }

      obs.push({
        x: currX,
        type,
        width: type === 'puddle' ? 48 : type === 'log' ? 36 : type === 'crate' ? 34 : 44,
        height: type === 'puddle' ? 14 : type === 'log' ? 28 : type === 'crate' ? 32 : 24,
        passed: false,
      });

      // Item before obstacle
      items.push({
        x: currX - 100,
        y: 200,
        type: i % 2 === 0 ? 'coin' : 'star',
        collected: false,
      });

      // Reward item above obstacle
      items.push({
        x: currX,
        y: type === 'branch' ? 240 : 145,
        type: 'star',
        collected: false,
      });
    }

    gameState.current.obstacles = obs;
    gameState.current.items = items;
    gameState.current.maxDistance = currX + 350;
    gameState.current.lives = 3;
    gameState.current.score = 0;
    gameState.current.coins = 0;
    gameState.current.stars = 0;
    gameState.current.distance = 0;
    gameState.current.isFinished = false;
    setLives(3);
    setScore(0);
    setCoinsCollected(0);
    setStarsCollected(0);
    setIsGameOverState(false);
  }, [level]);

  // Jump handler
  const handleJump = () => {
    const s = gameState.current;
    if (s.isGrounded && !s.isSliding && !s.isFinished) {
      s.vy = -12.5;
      s.isGrounded = false;
      sound.playJump();
    }
  };

  // Slide handler
  const handleSlide = () => {
    const s = gameState.current;
    if (s.isGrounded && !s.isSliding && !s.isFinished) {
      s.isSliding = true;
      s.slideTimer = 28;
      sound.playJump();
    }
  };

  // Immediate Game Over / Out Trigger (can also be called by Test button)
  const triggerOut = (reason: 'lives' | 'timeout') => {
    const s = gameState.current;
    if (s.isFinished) return;
    s.isFinished = true;
    s.lives = 0;
    setLives(0);
    setIsGameOverState(true);
    sound.playGameOver();

    const pct = Math.min(100, Math.floor((s.distance / s.maxDistance) * 100));
    setTimeout(() => {
      onGameOver(reason, s.score, pct);
    }, 700);
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
      if (!isPaused && !gameState.current.isFinished) {
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

        if (s.invincibleTimer > 0) {
          s.invincibleTimer--;
        }

        // Check Items collection
        s.items.forEach((item) => {
          if (!item.collected) {
            const screenX = item.x - s.distance + s.playerX;
            if (Math.abs(screenX - s.playerX) < 32 && Math.abs(item.y - s.playerY) < 38) {
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

        // Check Obstacles collision - takes 1 Heart Damage!
        s.obstacles.forEach((obs) => {
          const screenX = obs.x - s.distance + s.playerX;

          // Check if obstacle has completely passed behind player
          if (screenX < s.playerX - 45) {
            obs.passed = true;
          }

          if (!obs.passed && Math.abs(screenX - s.playerX) < 32) {
            let hit = false;

            if (obs.type === 'puddle' || obs.type === 'log' || obs.type === 'crate') {
              // Ground obstacles: hit if player feet are near ground
              if (s.playerY >= s.groundY - 14) {
                hit = true;
              }
            } else if (obs.type === 'branch') {
              // Overhead branch: hit if player is NOT sliding
              if (!s.isSliding) {
                hit = true;
              }
            }

            if (hit) {
              obs.passed = true;
              if (s.invincibleTimer <= 0) {
                s.lives -= 1;
                setLives(s.lives);
                s.invincibleTimer = 48; // Invincibility flash frames
                sound.playHit();

                // Flash damage screen
                setDamageFlash(true);
                setTimeout(() => setDamageFlash(false), 200);

                // Add floating text "-1 ❤️ OUCH!"
                s.floatingTexts.push({
                  x: s.playerX,
                  y: s.playerY - 30,
                  text: '-1 ❤️ OUCH!',
                  color: '#ef4444',
                  alpha: 1.0,
                });

                // OUT / GAME OVER Check
                if (s.lives <= 0 && !s.isFinished) {
                  s.isFinished = true;
                  setIsGameOverState(true);
                  sound.playGameOver();

                  // Delay slightly so player sees the final impact
                  setTimeout(() => {
                    onGameOver('lives', s.score, pct);
                  }, 700);
                  return;
                }
              }
            }
          }
        });

        // Update floating texts
        s.floatingTexts.forEach((ft) => {
          ft.y -= 1.2;
          ft.alpha -= 0.025;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => ft.alpha > 0);

        // Check Level Win condition
        if (s.distance >= s.maxDistance && !s.isFinished) {
          s.isFinished = true;
          const earnedStars = calculateStars(s.score, level.targetStarsScore);
          sound.playVictory();
          try {
            confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
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
                  // Cartoon Mud Splash Puddle
                  ctx.fillStyle = '#78350f';
                  ctx.beginPath();
                  ctx.ellipse(ox, s.groundY + 28, 24, 8, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#92400e';
                  ctx.beginPath();
                  ctx.ellipse(ox - 3, s.groundY + 27, 16, 5, 0, 0, Math.PI * 2);
                  ctx.fill();
                  // Mud bubbles
                  ctx.fillStyle = '#b45309';
                  ctx.beginPath();
                  ctx.arc(ox + 5, s.groundY + 25, 3, 0, Math.PI * 2);
                  ctx.fill();
                } else if (obs.type === 'log') {
                  // Cartoon wooden log
                  ctx.fillStyle = '#713f12';
                  ctx.beginPath();
                  ctx.roundRect(ox - 16, s.groundY + 6, 32, 22, 6);
                  ctx.fill();
                  ctx.fillStyle = '#a16207';
                  ctx.beginPath();
                  ctx.arc(ox - 16, s.groundY + 17, 6, 0, Math.PI * 2);
                  ctx.fill();
                } else if (obs.type === 'branch') {
                  // Low hanging canopy branch (MUST SLIDE)
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(ox - 35, s.groundY - 34, 70, 12);
                  ctx.fillStyle = '#16a34a';
                  ctx.beginPath();
                  ctx.arc(ox - 18, s.groundY - 30, 14, 0, Math.PI * 2);
                  ctx.arc(ox + 18, s.groundY - 30, 16, 0, Math.PI * 2);
                  ctx.fill();
                  // Downward arrow prompt
                  ctx.fillStyle = '#fef08a';
                  ctx.font = 'bold 10px sans-serif';
                  ctx.fillText('DUCK ⬇', ox - 20, s.groundY - 40);
                } else if (obs.type === 'crate') {
                  // Supply crate (MUST JUMP)
                  ctx.fillStyle = '#b45309';
                  ctx.beginPath();
                  ctx.roundRect(ox - 15, s.groundY + 2, 30, 26, 4);
                  ctx.fill();
                  ctx.strokeStyle = '#78350f';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(ox - 13, s.groundY + 4, 26, 22);
                  ctx.fillStyle = '#fef08a';
                  ctx.font = 'bold 12px sans-serif';
                  ctx.fillText('⭐', ox - 6, s.groundY + 19);
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
              ctx.fillStyle = '#e2e8f0';
              ctx.fillRect(finishX, s.groundY - 60, 6, 90);
              ctx.fillStyle = '#eab308';
              ctx.beginPath();
              ctx.moveTo(finishX + 6, s.groundY - 60);
              ctx.lineTo(finishX + 46, s.groundY - 45);
              ctx.lineTo(finishX + 6, s.groundY - 30);
              ctx.fill();
              drawStar(ctx, finishX + 24, s.groundY - 45, 6, 5, '#ffffff');
            }

            // Draw Character (flicker when damaged, or defeat tumble if OUT)
            if (s.lives <= 0) {
              // Tumble defeat
              ctx.save();
              ctx.translate(s.playerX, s.playerY);
              ctx.rotate(0.5);
              drawCartoonSoldier(ctx, 0, 0, 1, character, 'slide', s.frame);
              // Dizzy stars above head
              drawStar(ctx, 0, -35, 7, 5, '#f59e0b');
              drawStar(ctx, 15, -40, 5, 5, '#f59e0b');
              ctx.restore();
            } else if (s.invincibleTimer <= 0 || s.invincibleTimer % 6 < 3) {
              const playerAction = s.isSliding ? 'slide' : !s.isGrounded ? 'jump' : 'run';
              drawCartoonSoldier(ctx, s.playerX, s.playerY, 1, character, playerAction, s.frame);
            }

            // Draw Floating texts
            s.floatingTexts.forEach((ft) => {
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.alpha);
              ctx.fillStyle = ft.color;
              ctx.font = 'bold 15px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(ft.text, ft.x, ft.y);
              ctx.restore();
            });

            // Big OUT banner if defeated
            if (s.lives <= 0) {
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#ef4444';
              ctx.font = '900 36px Fredoka, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('आउट! OUT! 💔', canvas.width / 2, canvas.height / 2);
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, level, character, onVictory, onGameOver]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 p-2 sm:p-4 select-none transition-colors duration-150 ${damageFlash ? 'bg-red-950/80 ring-8 ring-rose-500' : ''}`}>
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3 Lives / Hearts */}
          <div className="flex items-center gap-1 bg-red-950/70 px-2.5 py-1 rounded-xl border border-red-500/70">
            {[1, 2, 3].map((heartIdx) => (
              <span
                key={heartIdx}
                className={`text-lg transition-transform ${
                  heartIdx <= lives ? 'scale-100 text-rose-500 animate-pulse' : 'scale-90 opacity-25 grayscale'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/30 px-2 py-1 rounded-xl border border-amber-400">
            <span className="text-base sm:text-lg">⭐</span>
            <span className="font-bold text-sm sm:text-base text-amber-300">{starsCollected}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/30 px-2 py-1 rounded-xl border border-yellow-400">
            <span className="text-base sm:text-lg">🪙</span>
            <span className="font-bold text-sm sm:text-base text-yellow-300">{coinsCollected}</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-[140px] mx-2">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-200">Distance</span>
          <div className="w-full bg-emerald-950 rounded-full h-3 border border-emerald-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-xl border border-emerald-600 cursor-pointer"
            aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-red-700/80 hover:bg-red-600 active:scale-95 rounded-xl border border-red-500 cursor-pointer"
            aria-label="Exit Game"
          >
            <X size={18} />
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

        {/* Damage Warning Banner if 1 heart remaining */}
        {lives === 1 && !isPaused && !isGameOverState && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg border border-red-400 animate-bounce pointer-events-none">
            ⚠️ LAST HEART! CAREFUL!
          </div>
        )}

        {/* Pause Modal */}
        {isPaused && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-20 p-4">
            <h3 className="text-3xl font-extrabold text-amber-300">Game Paused</h3>
            <p className="text-emerald-200 text-sm">{level.name}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg border-b-4 border-emerald-800 flex items-center gap-2 cursor-pointer active:translate-y-1"
              >
                <Play size={18} /> Resume
              </button>
              <button
                onClick={() => {
                  gameState.current.distance = 0;
                  gameState.current.score = 0;
                  gameState.current.coins = 0;
                  gameState.current.stars = 0;
                  gameState.current.lives = 3;
                  gameState.current.invincibleTimer = 0;
                  gameState.current.isFinished = false;
                  setScore(0);
                  setLives(3);
                  setCoinsCollected(0);
                  setStarsCollected(0);
                  setIsPaused(false);
                  setIsGameOverState(false);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg border-b-4 border-amber-800 flex items-center gap-2 cursor-pointer active:translate-y-1"
              >
                <RotateCcw size={18} /> Restart
              </button>
              {/* Test Out / Give Up button to immediately test Game Over */}
              <button
                onClick={() => {
                  setIsPaused(false);
                  triggerOut('lives');
                }}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-rose-900 flex items-center gap-2 cursor-pointer active:translate-y-1"
              >
                <Skull size={18} /> Give Up (आउट टेस्ट)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Big Child-Friendly Touch Controls */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-3 sm:gap-4 pb-2">
        <button
          onClick={handleSlide}
          className="py-3.5 sm:py-4 bg-gradient-to-b from-teal-500 to-teal-700 active:from-teal-600 active:to-teal-800 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl border-b-4 border-teal-900 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1 active:border-b-0"
        >
          <ArrowDown size={28} className="stroke-[3]" />
          SLIDE / DUCK (झुकें)
        </button>
        <button
          onClick={handleJump}
          className="py-3.5 sm:py-4 bg-gradient-to-b from-amber-500 to-amber-700 active:from-amber-600 active:to-amber-800 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl border-b-4 border-amber-900 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1 active:border-b-0"
        >
          <ArrowUp size={28} className="stroke-[3]" />
          JUMP! (कूदें)
        </button>
      </div>
    </div>
  );
};
