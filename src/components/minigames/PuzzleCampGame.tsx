import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, X, Check, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface PuzzlePart {
  id: string;
  name: string;
  icon: string;
  color: string;
  placed: boolean;
  targetSlot: number;
}

export const PuzzleCampGame: React.FC<Props> = ({ level, onVictory, onGameOver, onExit }) => {
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
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(level.timeLimitSeconds || 40);
  const [isFinished, setIsFinished] = useState(false);

  const resetPuzzle = () => {
    setParts(defaultParts.map((p) => ({ ...p, placed: false })));
    setSelectedPartId(null);
    setPlacedCount(0);
    setLives(3);
    setTimeLeft(level.timeLimitSeconds || 40);
    setIsFinished(false);
  };

  useEffect(() => {
    resetPuzzle();
  }, [level]);

  // Timer loop
  useEffect(() => {
    const timerId = setInterval(() => {
      if (!isFinished) {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0 && !isFinished) {
            setIsFinished(true);
            sound.playGameOver();
            const pct = Math.min(90, Math.floor((placedCount / defaultParts.length) * 100));
            setTimeout(() => {
              onGameOver('timeout', placedCount * 25, pct);
            }, 600);
            return 0;
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [isFinished, placedCount, defaultParts.length]);

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (isFinished) return;
    setIsFinished(true);
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(90, Math.floor((placedCount / parts.length) * 100));
    onGameOver('mistakes', placedCount * 25, pct);
  };

  const handleSelectTrayPart = (part: PuzzlePart) => {
    if (part.placed || isFinished) return;
    setSelectedPartId(part.id);
    sound.playCardFlip();
  };

  const handleSlotClick = (slotIdx: number) => {
    if (!selectedPartId || isFinished) return;
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
        setIsFinished(true);
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
      // Wrong slot click -> deduct 1 Heart!
      sound.playTryAgain();
      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives <= 0) {
        setIsFinished(true);
        sound.playGameOver();
        const pct = Math.min(90, Math.floor((placedCount / parts.length) * 100));
        setTimeout(() => {
          onGameOver('mistakes', placedCount * 25, pct);
        }, 600);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-indigo-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-indigo-900/90 border-2 border-indigo-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
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
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">
              {placedCount} / {parts.length} Parts
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
            onClick={resetPuzzle}
            className="p-2 bg-indigo-800 hover:bg-indigo-700 active:scale-95 rounded-xl border border-indigo-600 cursor-pointer"
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

      {/* Assembly Blueprint View */}
      <div className="relative w-full max-w-lg flex-1 flex flex-col items-center justify-center p-2">
        <div className="w-full bg-slate-900/90 rounded-3xl border-4 border-indigo-500 p-4 shadow-2xl flex flex-col items-center">
          <h4 className="text-indigo-200 font-bold mb-3 text-sm">
            {placedCount === parts.length
              ? '🎉 All Assembled!'
              : 'Tap part below, then tap matching slot! 3 mistakes = OUT!'}
          </h4>

          {/* Blueprint slots */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-md">
            {parts.map((p, idx) => {
              const isFilled = p.placed;

              return (
                <button
                  key={`slot-${idx}`}
                  onClick={() => handleSlotClick(idx)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-200 cursor-pointer relative ${
                    isFilled
                      ? 'bg-emerald-600/60 border-emerald-400'
                      : selectedPartId
                      ? 'bg-indigo-900/40 border-amber-400 hover:bg-indigo-800/60 animate-pulse'
                      : 'bg-slate-800/50 border-slate-600'
                  }`}
                >
                  {isFilled ? (
                    <>
                      <span className="text-3xl">{p.icon}</span>
                      <span className="text-[10px] font-bold text-emerald-200 mt-1 line-clamp-1">
                        {p.name}
                      </span>
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 text-stone-900 flex items-center justify-center">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <span className="text-xl">🔲</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Slot {idx + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Parts Tray at bottom */}
      <div className="w-full max-w-lg bg-indigo-900/80 border-2 border-indigo-600 rounded-3xl p-3 flex flex-col items-center shadow-xl mb-1">
        <div className="text-xs font-extrabold text-amber-300 mb-2">Parts Tray (Choose a part):</div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {parts.map((part) => {
            const isSelected = selectedPartId === part.id;
            const isPlaced = part.placed;

            if (isPlaced) return null;

            return (
              <button
                key={part.id}
                onClick={() => handleSelectTrayPart(part)}
                className={`px-3 py-2 rounded-2xl flex items-center gap-2 border-2 transition-all duration-200 font-extrabold text-xs shadow-md cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-stone-900 border-amber-300 scale-105 shadow-amber-500/50'
                    : 'bg-indigo-800 hover:bg-indigo-700 text-white border-indigo-500'
                }`}
              >
                <span className="text-xl">{part.icon}</span>
                <span>{part.name}</span>
              </button>
            );
          })}

          {placedCount === parts.length && (
            <div className="text-emerald-300 font-black text-sm py-1">
              Mission accomplished! Ready for deployment! 🚀
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
