import React from 'react';
import { LevelConfig } from '../../types/game';
import { RotateCcw, ArrowRight, Home } from 'lucide-react';

interface Props {
  level: LevelConfig;
  starsEarned: number;
  score: number;
  coinsEarned: number;
  onNextLevel: () => void;
  onRetry: () => void;
  onHome: () => void;
  hasNextLevel: boolean;
}

export const VictoryModal: React.FC<Props> = ({
  level,
  starsEarned,
  score,
  coinsEarned,
  onNextLevel,
  onRetry,
  onHome,
  hasNextLevel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-emerald-800 to-emerald-950 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative rays */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-block bg-amber-500/30 border border-amber-400/60 px-4 py-1 rounded-full text-amber-300 font-extrabold text-xs tracking-wider uppercase mb-2">
          Mission Completed!
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
          VICTORY!
        </h2>
        <p className="text-emerald-200 text-sm mt-0.5">{level.name}</p>

        {/* 3 Animated Stars */}
        <div className="flex justify-center items-center gap-3 my-5">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= starsEarned;
            return (
              <div
                key={starIdx}
                className={`text-5xl sm:text-6xl transition-all duration-500 transform ${
                  isEarned
                    ? 'scale-110 drop-shadow-[0_4px_12px_rgba(250,204,21,0.6)] animate-bounce'
                    : 'grayscale opacity-30 scale-90'
                }`}
                style={{ animationDelay: `${starIdx * 150}ms` }}
              >
                ⭐
              </div>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-emerald-300 font-semibold">Coins Earned</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl">🪙</span>
              <span className="text-2xl font-black text-yellow-300">+{coinsEarned}</span>
            </div>
          </div>
          <div className="bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-emerald-300 font-semibold">Mission Score</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl">🎯</span>
              <span className="text-2xl font-black text-white">{score}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-5">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-500 active:to-amber-700 text-emerald-950 font-black text-xl rounded-2xl shadow-xl border-b-4 border-amber-800 flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0 cursor-pointer"
            >
              NEXT LEVEL <ArrowRight size={26} className="stroke-[3]" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRetry}
              className="py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold rounded-2xl border-2 border-emerald-500 shadow-md flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
            >
              <RotateCcw size={18} /> Play Again
            </button>
            <button
              onClick={onHome}
              className="py-3 bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 text-emerald-200 font-bold rounded-2xl border-2 border-emerald-700 shadow-md flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
            >
              <Home size={18} /> Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
