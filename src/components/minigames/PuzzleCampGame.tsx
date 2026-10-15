import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, X, Check } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver?: (reason: 'lives' | 'timeout' | 'moves', score: number, progressPct: number) => void;
  onExit: () => void;
}

interface PuzzlePart {
  id: string;
  name: string;
  icon: string;
  color: string;
  placed: boolean;
  targetSlot: number;
}

export const PuzzleCampGame: React.FC<Props> = ({ level, onVictory, onExit }) => {
  const isHelicopter = level.id >= 15;
  const puzzleTitle = isHelicopter ? 'Rescue Helicopter' : 'Friendly Army Jeep';

  const defaultParts: PuzzlePart[] = isHelicopter
    ? [
        { id: 'cockpit', name: 'Bubble Cabin', icon: '🚁', color: 'bg-emerald-500', placed: false, targetSlot: 0 },
        { id: 'rotor', name: 'Main Rotor', icon: '🌀', color: 'bg-slate-400', placed: false, targetSlot: 1 },
        { id: 'tail', name: 'Tail Fin', icon: '📐', color: 'bg-emerald-600', placed: false, targetSlot: 2 },
        { id: 'skids', name: 'Landing Skids', icon: '🎿', color: 'bg-zinc-600', placed: false, targetSlot: 3 },
        { id: 'star', name: 'Rescue Cross', icon: '⭐', color: 'bg-amber-400', placed: false, targetSlot: 4 },
      ]
    : [
        { id: 'chassis', name: 'Green Body', icon: '🚙', color: 'bg-emerald-600', placed: false, targetSlot: 0 },
        { id: 'windshield', name: 'Windshield', icon: '🪟', color: 'bg-sky-400', placed: false, targetSlot: 1 },
        { id: 'wheel_front', name: 'Front Wheel', icon: '🛞', color: 'bg-zinc-800', placed: false, targetSlot: 2 },
        { id: 'wheel_back', name: 'Back Wheel', icon: '🛞', color: 'bg-zinc-800', placed: false, targetSlot: 3 },
        { id: 'star_badge', name: 'Gold Star', icon: '⭐', color: 'bg-amber-400', placed: false, targetSlot: 4 },
      ];

  const [parts, setParts] = useState<PuzzlePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [placedCount, setPlacedCount] = useState(0);

  const resetPuzzle = () => {
    setParts(defaultParts.map((p) => ({ ...p, placed: false })));
    setSelectedPartId(null);
    setPlacedCount(0);
  };

  useEffect(() => {
    resetPuzzle();
  }, [level]);

  const handleSelectTrayPart = (part: PuzzlePart) => {
    if (part.placed) return;
    setSelectedPartId(part.id);
    sound.playCardFlip();
  };

  const handleSlotClick = (slotIdx: number) => {
    if (!selectedPartId) return;
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part || part.placed) return;

    // Check if correct target slot
    if (part.targetSlot === slotIdx) {
      sound.playSnap();
      const updated = parts.map((p) => (p.id === part.id ? { ...p, placed: true } : p));
      setParts(updated);
      setSelectedPartId(null);
      const nextCount = placedCount + 1;
      setPlacedCount(nextCount);

      if (nextCount >= parts.length) {
        // Assembled completely!
        const score = 100 + parts.length * 20;
        const earnedStars = calculateStars(score, level.targetStarsScore);
        sound.playVictory();
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        setTimeout(() => {
          onVictory(earnedStars, score, 25);
        }, 1200);
      }
    } else {
      sound.playTryAgain();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-indigo-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-indigo-900/90 border-2 border-indigo-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">
              {placedCount} / {parts.length} Parts
            </span>
          </div>
          <div className="font-bold text-indigo-200 text-sm">
            {puzzleTitle}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetPuzzle}
            className="p-2 bg-indigo-800 hover:bg-indigo-700 active:scale-95 rounded-xl border border-indigo-600"
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

      {/* Assembly Blueprint View */}
      <div className="relative w-full max-w-lg flex-1 flex flex-col items-center justify-center p-2">
        <div className="w-full bg-slate-900/90 rounded-3xl border-4 border-indigo-500 p-4 shadow-2xl flex flex-col items-center">
          <h4 className="text-indigo-200 font-bold mb-3 text-sm">
            {placedCount === parts.length ? '🎉 All Assembled!' : 'Tap part below, then tap matching slot!'}
          </h4>

          {/* Blueprint slots */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-md">
            {parts.map((p, idx) => {
              const isFilled = p.placed;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSlotClick(idx)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 relative
                    ${
                      isFilled
                        ? 'bg-emerald-600/90 border-emerald-400 scale-100 shadow-md'
                        : selectedPartId === p.id
                        ? 'bg-indigo-700/60 border-amber-400 border-dashed animate-pulse ring-2 ring-amber-400'
                        : 'bg-indigo-950/80 border-indigo-500/50 border-dashed hover:border-indigo-400'
                    }`}
                >
                  {isFilled ? (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">{p.icon}</span>
                      <Check size={16} className="text-emerald-200 mt-1 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <span className="text-2xl filter grayscale">{p.icon}</span>
                      <span className="text-[10px] text-indigo-300 mt-1">Slot {idx + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Big Cartoon Vehicle Reveal when assembled */}
          {placedCount === parts.length && (
            <div className="mt-4 animate-bounce text-6xl">
              {isHelicopter ? '🚁💨' : '🚙💨'}
            </div>
          )}
        </div>
      </div>

      {/* Parts Tray at bottom */}
      <div className="w-full max-w-lg bg-indigo-900/90 border-2 border-indigo-600 rounded-3xl p-3 shadow-xl">
        <div className="text-xs font-semibold text-indigo-200 mb-2 px-1">
          Parts Tray (Tap to Pick):
        </div>
        <div className="grid grid-cols-5 gap-2">
          {parts.map((part) => {
            const isSelected = selectedPartId === part.id;
            const isPlaced = part.placed;

            return (
              <button
                key={part.id}
                onClick={() => handleSelectTrayPart(part)}
                disabled={isPlaced}
                className={`py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:scale-95
                  ${
                    isPlaced
                      ? 'opacity-20 border-transparent bg-indigo-950 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500 border-amber-300 ring-4 ring-amber-300/50 scale-105'
                      : 'bg-indigo-800 hover:bg-indigo-700 border-indigo-500 cursor-pointer'
                  }`}
              >
                <span className="text-2xl sm:text-3xl">{part.icon}</span>
                <span className="text-[9px] font-bold text-white truncate max-w-[50px] mt-1">
                  {part.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
