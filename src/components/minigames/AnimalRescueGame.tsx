import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, X, Heart, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface Tile {
  x: number;
  y: number;
  type: 'grass' | 'rock' | 'water' | 'bridge' | 'tent' | 'treat' | 'star';
  collected?: boolean;
}

export const AnimalRescueGame: React.FC<Props> = ({ level, onVictory, onGameOver, onExit }) => {
  const [animalPos, setAnimalPos] = useState({ x: 0, y: 0 });
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [treatsCollected, setTreatsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);

  const maxMoves = level.id >= 19 ? 18 : level.id >= 13 ? 16 : 14;

  // Pick animal based on level
  const animalEmoji = level.id === 13 ? '🐼' : level.id === 19 ? '🐰' : '🐶';
  const animalName = level.id === 13 ? 'Baby Panda Pip' : level.id === 19 ? 'Bunny Hoppy' : 'Puppy Rover';
  const treatEmoji = level.id === 13 ? '🎍' : level.id === 19 ? '🥕' : '🦴';

  const rows = 5;
  const cols = 6;
  const tentPos = { x: cols - 1, y: rows - 1 };

  // Generate board
  const setupBoard = () => {
    const newGrid: Tile[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ x: c, y: r, type: 'grass' });
      }
      newGrid.push(row);
    }

    // Starting animal
    setAnimalPos({ x: 0, y: 0 });

    // Target Tent
    newGrid[tentPos.y][tentPos.x].type = 'tent';

    // Obstacles depending on level
    if (level.id >= 13) {
      newGrid[1][2].type = 'rock';
      newGrid[2][4].type = 'rock';
      newGrid[3][1].type = 'rock';
      newGrid[2][2].type = 'bridge';
      newGrid[1][4].type = 'treat';
      newGrid[3][3].type = 'treat';
      newGrid[0][3].type = 'star';
      newGrid[4][2].type = 'star';
    } else {
      newGrid[1][1].type = 'rock';
      newGrid[3][3].type = 'rock';
      newGrid[0][2].type = 'treat';
      newGrid[2][3].type = 'treat';
      newGrid[1][4].type = 'star';
      newGrid[3][2].type = 'star';
    }

    setGrid(newGrid);
    setMovesCount(0);
    setLives(3);
    setTreatsCollected(0);
    setStarsCollected(0);
    setIsWon(false);
  };

  useEffect(() => {
    setupBoard();
  }, [level]);

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (isWon) return;
    setIsWon(true);
    setLives(0);
    sound.playGameOver();
    const score = treatsCollected * 20 + starsCollected * 30;
    const distFromStart = animalPos.x + animalPos.y;
    const totalDist = cols - 1 + (rows - 1);
    const pct = Math.min(95, Math.floor((distFromStart / totalDist) * 100));
    onGameOver('lives', score, pct);
  };

  const moveAnimal = (dx: number, dy: number) => {
    if (isWon) return;
    const nx = animalPos.x + dx;
    const ny = animalPos.y + dy;

    // Check bounds
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;

    // Check rock obstacle - bumping into rock deals 1 Heart damage!
    const targetTile = grid[ny][nx];
    if (targetTile.type === 'rock') {
      sound.playHit();
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 200);

      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives <= 0) {
        setIsWon(true);
        sound.playGameOver();
        const score = treatsCollected * 20 + starsCollected * 30;
        const distFromStart = animalPos.x + animalPos.y;
        const totalDist = cols - 1 + (rows - 1);
        const pct = Math.min(95, Math.floor((distFromStart / totalDist) * 100));
        setTimeout(() => {
          onGameOver('lives', score, pct);
        }, 600);
      }
      return;
    }

    // Valid move!
    setAnimalPos({ x: nx, y: ny });
    const newMoves = movesCount + 1;
    setMovesCount(newMoves);
    sound.playJump();

    // Check collect treats or stars
    if (targetTile.type === 'treat' && !targetTile.collected) {
      targetTile.collected = true;
      setTreatsCollected((t) => t + 1);
      sound.playCoin();
    } else if (targetTile.type === 'star' && !targetTile.collected) {
      targetTile.collected = true;
      setStarsCollected((s) => s + 1);
      sound.playStar();
    }

    // Check Tent goal
    if (nx === tentPos.x && ny === tentPos.y) {
      setIsWon(true);
      const score = 100 + treatsCollected * 30 + starsCollected * 40 - Math.min(50, newMoves * 2);
      const earnedStars = calculateStars(score, level.targetStarsScore);
      sound.playVictory();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        onVictory(earnedStars, score, 25);
      }, 1200);
      return;
    }

    // Check out of moves -> GAME OVER!
    if (newMoves >= maxMoves) {
      setIsWon(true);
      sound.playGameOver();
      const score = treatsCollected * 20 + starsCollected * 30;
      const distFromStart = nx + ny;
      const totalDist = cols - 1 + (rows - 1);
      const pct = Math.min(95, Math.floor((distFromStart / totalDist) * 100));
      setTimeout(() => {
        onGameOver('moves', score, pct);
      }, 600);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveAnimal(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveAnimal(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveAnimal(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveAnimal(1, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animalPos, movesCount, lives, isWon]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 p-2 sm:p-4 select-none ${damageFlash ? 'bg-red-950' : ''}`}>
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl px-4 py-2 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
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
            <span className="text-xl">{treatEmoji}</span>
            <span className="font-bold text-lg text-amber-300">
              {treatsCollected}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-sky-500/20 px-3 py-1 rounded-xl border border-sky-400/40">
            <span className="text-sm">🐾</span>
            <span className="font-bold text-sm text-sky-200">
              {maxMoves - movesCount} left
            </span>
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
            onClick={setupBoard}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-xl border border-emerald-600 cursor-pointer"
            aria-label="Restart Puzzle"
          >
            <RotateCcw size={20} />
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

      {/* Grid Gameboard */}
      <div className="relative w-full max-w-md flex-1 flex flex-col items-center justify-center p-2">
        <div className="text-emerald-200 font-extrabold text-xs mb-2">
          Lead {animalName} to the Camp Tent before running out of steps or hearts!
        </div>

        <div
          className="grid gap-2 p-3 bg-emerald-900/80 rounded-3xl border-4 border-emerald-600 shadow-2xl"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rIdx) =>
            row.map((tile, cIdx) => {
              const isAnimalHere = animalPos.x === cIdx && animalPos.y === rIdx;
              const isTent = tile.type === 'tent';
              const isRock = tile.type === 'rock';
              const isBridge = tile.type === 'bridge';
              const isTreat = tile.type === 'treat' && !tile.collected;
              const isStar = tile.type === 'star' && !tile.collected;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    const dx = cIdx - animalPos.x;
                    const dy = rIdx - animalPos.y;
                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                      moveAnimal(dx, dy);
                    }
                  }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl relative shadow-md transition-all duration-150 ${
                    isTent
                      ? 'bg-amber-400 border-2 border-amber-600'
                      : isRock
                      ? 'bg-stone-700 border-2 border-stone-800'
                      : isBridge
                      ? 'bg-amber-700 border-2 border-amber-800'
                      : 'bg-emerald-600/80 hover:bg-emerald-500/80 border-2 border-emerald-500'
                  }`}
                >
                  {isRock && '🪨'}
                  {isTent && '⛺'}
                  {isTreat && treatEmoji}
                  {isStar && '⭐'}
                  {isAnimalHere && (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">
                      {animalEmoji}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Touch D-Pad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-2 pb-2">
        <div />
        <button
          onClick={() => moveAnimal(0, -1)}
          className="py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-emerald-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowUp size={24} />
        </button>
        <div />
        <button
          onClick={() => moveAnimal(-1, 0)}
          className="py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-emerald-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => moveAnimal(0, 1)}
          className="py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-emerald-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onClick={() => moveAnimal(1, 0)}
          className="py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 active:from-emerald-700 active:to-emerald-900 text-white font-extrabold rounded-2xl shadow-md border-b-4 border-emerald-950 flex items-center justify-center active:translate-y-1"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
