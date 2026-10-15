import React from 'react';
import { MiniGameId, LevelConfig } from '../../types/game';
import { MINI_GAMES_INFO, LEVELS } from '../../game/levels';
import { X, Play } from 'lucide-react';

interface Props {
  onSelectMiniGame: (gameId: MiniGameId) => void;
  onClose: () => void;
}

export const MiniGamesHubModal: React.FC<Props> = ({ onSelectMiniGame, onClose }) => {
  const miniGameKeys = Object.keys(MINI_GAMES_INFO) as MiniGameId[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 border-4 border-amber-400 rounded-3xl p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                Mini-Games Hub
              </h2>
              <p className="text-xs text-emerald-200">
                Choose any of the 8 exciting cadet games!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-2xl border border-emerald-600 text-white cursor-pointer"
            aria-label="Close Mini Games Hub"
          >
            <X size={22} />
          </button>
        </div>

        {/* 8 Mini Games Grid */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {miniGameKeys.map((gameId) => {
            const info = MINI_GAMES_INFO[gameId];
            return (
              <button
                key={gameId}
                onClick={() => onSelectMiniGame(gameId)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/90 border-2 border-emerald-500/80 shadow-md text-left transition-all duration-150 active:scale-95 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border-2 border-emerald-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-amber-300 truncate">
                      {info.name}
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-bold">
                      {info.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100 line-clamp-2 mt-0.5 leading-snug">
                    {info.shortDesc}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md">
                  <Play size={16} className="fill-emerald-950 ml-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
