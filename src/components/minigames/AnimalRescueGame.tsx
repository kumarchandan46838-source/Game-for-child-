import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, X, Heart } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onExit: () => void;
}

interface Tile {
  x: number;
  y: number;
  type: 'grass' | 'rock' | 'water' | 'bridge' | 'tent' | 'treat' | 'star';
  collected?: boolean;
}

export const AnimalRescueGame: React.FC<Props> = ({ level, onVictory, onExit }) => {
  const [animalPos, setAnimalPos] = useState({ x: 0, y: 0 });
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [treatsCollected, setTreatsCollected] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isWon, setIsWon] = useState(false);

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
      // rocks & water
      newGrid[1][2].type = 'rock';
      newGrid[2][4].type = 'rock';
      newGrid[3][1].type = 'rock';
      newGrid[2][2].type = 'bridge';
      newGrid[1][4].type = 'treat';
      newGrid[3][3].type = 'treat';
      newGrid[0][3].type = 'star';
      newGrid[4][2].type = 'star';
    } else {
      // simpler layout for level 5
      newGrid[1][1].type = 'rock';
      newGrid[3][3].type = 'rock';
      newGrid[0][2].type = 'treat';
      newGrid[2][3].type = 'treat';
      newGrid[1][4].type = 'star';
      newGrid[3][2].type = 'star';
    }

    setGrid(newGrid);
    setMovesCount(0);
    setTreatsCollected(0);
    setStarsCollected(0);
    setIsWon(false);
  };

  useEffect(() => {
    setupBoard();
  }, [level]);

  const moveAnimal = (dx: number, dy: number) => {
    if (isWon) return;
    const nx = animalPos.x + dx;
    const ny = animalPos.y + dy;

    // Check bounds
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;

    // Check rock obstacle
    const targetTile = grid[ny][nx];
    if (targetTile.type === 'rock') {
      sound.playTryAgain();
      return;
    }

    // Valid move!
    setAnimalPos({ x: nx, y: ny });
    setMovesCount((m) => m + 1);
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
      const score = 100 + treatsCollected * 30 + starsCollected * 40 - Math.min(50, movesCount * 2);
      const earnedStars = calculateStars(score, level.targetStarsScore);
      sound.playVictory();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        onVictory(earnedStars, score, 25);
      }, 1200);
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
  }, [animalPos, grid, isWon]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-lime-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-lime-900/90 border-2 border-lime-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">{starsCollected}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-lime-500/30 px-3 py-1 rounded-xl border border-lime-400">
            <span className="text-xl">{treatEmoji}</span>
            <span className="font-bold text-lg text-lime-200">{treatsCollected}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-200 font-bold text-sm">
          <span>🐾 Steps: {movesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={setupBoard}
            className="p-2 bg-lime-800 hover:bg-lime-700 active:scale-95 rounded-xl border border-lime-600"
            aria-label="Restart Puzzle"
          >
            <RotateCcw size={20} />
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

      {/* Guide Banner */}
      <div className="w-full max-w-2xl text-center py-1">
        <span className="inline-flex items-center gap-2 bg-lime-900/80 px-4 py-1.5 rounded-full border border-lime-500 text-lime-100 font-bold text-sm shadow-md">
          <Heart size={16} className="text-rose-400 fill-rose-400" />
          Help {animalName} reach the Cozy Tent 🏕️ safely!
        </span>
      </div>

      {/* Playable Grid */}
      <div className="relative w-full max-w-xl flex-1 flex items-center justify-center p-2">
        <div className="grid grid-cols-6 gap-2 w-full max-w-md aspect-[6/5] bg-emerald-900/90 p-3 rounded-3xl border-4 border-lime-600 shadow-2xl">
          {grid.map((row, r) =>
            row.map((tile, c) => {
              const isAnimalHere = animalPos.x === c && animalPos.y === r;
              const isTent = tile.type === 'tent';
              const isRock = tile.type === 'rock';
              const isBridge = tile.type === 'bridge';
              const isTreat = tile.type === 'treat' && !tile.collected;
              const isStar = tile.type === 'star' && !tile.collected;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => {
                    const dx = c - animalPos.x;
                    const dy = r - animalPos.y;
                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                      moveAnimal(dx, dy);
                    }
                  }}
                  className={`relative flex items-center justify-center rounded-2xl border-2 transition-all duration-150 cursor-pointer shadow-sm
                    ${
                      isTent
                        ? 'bg-amber-800/80 border-amber-400'
                        : isRock
                        ? 'bg-stone-700 border-stone-500'
                        : isBridge
                        ? 'bg-amber-700/60 border-amber-600'
                        : 'bg-emerald-800/70 border-emerald-600/70 hover:bg-emerald-700/80'
                    }`}
                >
                  {/* Static elements */}
                  {isTent && <span className="text-3xl animate-bounce">🏕️</span>}
                  {isRock && <span className="text-2xl">🪨</span>}
                  {isBridge && <span className="text-lg opacity-80">🪵</span>}
                  {isTreat && <span className="text-2xl animate-pulse">{treatEmoji}</span>}
                  {isStar && <span className="text-2xl animate-pulse">⭐</span>}

                  {/* Animal Sprite */}
                  {isAnimalHere && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 scale-125 transition-transform duration-200">
                      <span className="text-4xl filter drop-shadow-md animate-bounce">
                        {animalEmoji}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Touch D-Pad for Kids */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 pb-2">
        <div />
        <button
          onClick={() => moveAnimal(0, -1)}
          className="py-3 bg-lime-600 active:bg-lime-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-lime-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowUp size={24} />
        </button>
        <div />

        <button
          onClick={() => moveAnimal(-1, 0)}
          className="py-3 bg-lime-600 active:bg-lime-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-lime-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => moveAnimal(0, 1)}
          className="py-3 bg-lime-600 active:bg-lime-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-lime-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onClick={() => moveAnimal(1, 0)}
          className="py-3 bg-lime-600 active:bg-lime-700 text-white font-bold rounded-2xl shadow-md border-b-4 border-lime-900 flex items-center justify-center active:translate-y-1"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
