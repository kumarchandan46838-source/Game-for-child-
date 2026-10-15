import React from 'react';
import { LevelConfig, PlayerProfile } from '../../types/game';
import { LEVELS, MINI_GAMES_INFO } from '../../game/levels';
import { X, Lock, Play, Star } from 'lucide-react';
import { canUnlockLevel } from '../../game/logic';

interface Props {
  profile: PlayerProfile;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<Props> = ({
  profile,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 border-4 border-amber-400 rounded-3xl p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                Select Mission
              </h2>
              <p className="text-xs text-emerald-200">
                Level {profile.unlockedLevel} of 20 Unlocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-2xl border border-emerald-600 text-white cursor-pointer"
            aria-label="Close Level Select"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Levels Grid */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LEVELS.map((level) => {
            const isUnlocked = canUnlockLevel(profile.unlockedLevel, level.id);
            const stars = profile.levelStars[level.id] || 0;
            const gameInfo = MINI_GAMES_INFO[level.gameId];

            return (
              <button
                key={level.id}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(level)}
                className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-150 text-left text-white shadow-md active:scale-95
                  ${
                    isUnlocked
                      ? 'bg-emerald-800/80 hover:bg-emerald-700/90 border-emerald-500 cursor-pointer'
                      : 'bg-emerald-950/60 border-emerald-900/60 opacity-50 cursor-not-allowed'
                  }`}
              >
                {/* Level Number & Game Tag */}
                <div className="w-full flex items-center justify-between mb-1.5">
                  <span className="w-7 h-7 rounded-xl bg-amber-400 text-emerald-950 font-black text-sm flex items-center justify-center shadow-xs">
                    {level.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                    {gameInfo?.badge || 'Game'}
                  </span>
                </div>

                {/* Level Icon */}
                <div className="my-1 text-3xl">
                  {isUnlocked ? level.icon : <Lock size={28} className="text-emerald-400 opacity-60" />}
                </div>

                {/* Level Name */}
                <div className="text-xs font-bold text-center truncate w-full text-slate-100">
                  {level.name}
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      size={14}
                      className={
                        starIdx <= stars
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-emerald-950 fill-emerald-900/60'
                      }
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-emerald-800 text-center text-xs text-emerald-300 font-medium">
          Complete missions to unlock new training courses and earn stars!
        </div>
      </div>
    </div>
  );
};
