import React from 'react';
import { PlayerProfile } from '../types/game';
import { sound } from '../utils/audio';
import {
  Play,
  Gamepad2,
  Map,
  Award,
  Calendar,
  Volume2,
  VolumeX,
  Music,
  Shield,
  FileText,
  Smartphone,
  Maximize2,
} from 'lucide-react';

interface Props {
  profile: PlayerProfile;
  onPlayGame: () => void;
  onOpenMiniGames: () => void;
  onOpenLevelSelect: () => void;
  onOpenRewards: () => void;
  onOpenDailyChallenge: () => void;
  onOpenParentSettings: () => void;
  onOpenPrivacyPolicy: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
}

export const MainMenu: React.FC<Props> = ({
  profile,
  onPlayGame,
  onOpenMiniGames,
  onOpenLevelSelect,
  onOpenRewards,
  onOpenDailyChallenge,
  onOpenParentSettings,
  onOpenPrivacyPolicy,
  onToggleSound,
  onToggleMusic,
  isPhoneFrame,
  onTogglePhoneFrame,
}) => {
  const totalStars = Object.values(profile.levelStars).reduce((a, b) => a + b, 0);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-3 sm:p-5 select-none overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-950 to-green-950 text-white">
      {/* Animated Jungle Foliage & Clouds backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-10 w-56 h-56 rounded-full bg-amber-500 blur-3xl" />
        <div className="absolute -bottom-10 left-1/4 w-72 h-72 rounded-full bg-lime-600 blur-3xl" />
      </div>

      {/* Top Status Bar: Cadet Profile, Stars, Coins & Quick Utilities */}
      <div className="w-full max-w-xl z-10 flex items-center justify-between gap-2 bg-emerald-900/90 border-2 border-emerald-600 rounded-2xl px-3 py-2 shadow-lg backdrop-blur-xs">
        {/* Cadet Avatar & Level badge */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
            {profile.activeCharacter === 'Bella' ? '👩‍✈️' : profile.activeCharacter === 'Teddy' ? '🐻' : profile.activeCharacter === 'Maya' ? '🚁' : '🧑‍✈️'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-amber-300">
                {profile.activeCharacter}
              </span>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-bold border border-emerald-700">
                LVL {profile.unlockedLevel}
              </span>
            </div>
            <span className="text-[10px] text-emerald-300 block -mt-0.5">Cadet Explorer</span>
          </div>
        </div>

        {/* Currency Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-amber-500/25 px-2.5 py-1 rounded-xl border border-amber-400/50">
            <span className="text-base sm:text-lg">⭐</span>
            <span className="font-extrabold text-sm sm:text-base text-amber-300">
              {totalStars}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-yellow-500/25 px-2.5 py-1 rounded-xl border border-yellow-400/50">
            <span className="text-base sm:text-lg">🪙</span>
            <span className="font-extrabold text-sm sm:text-base text-yellow-300">
              {profile.coins}
            </span>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-200 border border-emerald-600 cursor-pointer"
            aria-label={profile.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {profile.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-stone-400" />}
          </button>
          <button
            onClick={onToggleMusic}
            className="p-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-200 border border-emerald-600 cursor-pointer"
            aria-label={profile.musicEnabled ? 'Mute Music' : 'Enable Music'}
          >
            <Music size={16} className={profile.musicEnabled ? 'text-amber-400' : 'text-stone-400'} />
          </button>
          <button
            onClick={onTogglePhoneFrame}
            className="p-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-200 border border-emerald-600 cursor-pointer hidden sm:flex"
            title="Toggle Android Device Frame"
            aria-label="Toggle Android Device Frame"
          >
            {isPhoneFrame ? <Maximize2 size={16} /> : <Smartphone size={16} />}
          </button>
        </div>
      </div>

      {/* Hero Title Lockup & Mascot Showcase */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center text-center my-auto py-2">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="relative mb-2">
          <svg viewBox="0 0 420 100" className="w-72 sm:w-96 max-w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id="armyTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="kidsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>
            </defs>
            {/* Crest Banner */}
            <path
              d="M 20,20 L 400,20 L 380,85 L 210,95 L 40,85 Z"
              fill="#14532d"
              stroke="#ca8a04"
              strokeWidth="5"
            />
            {/* Stars on Crest */}
            <circle cx="50" cy="35" r="5" fill="#facc15" />
            <circle cx="370" cy="35" r="5" fill="#facc15" />
            {/* Text Lockup */}
            <text
              x="210"
              y="52"
              textAnchor="middle"
              fill="url(#armyTitleGrad)"
              fontFamily="Fredoka, sans-serif"
              fontWeight="800"
              fontSize="34"
              letterSpacing="2"
              stroke="#451a03"
              strokeWidth="3"
              paintOrder="stroke fill"
            >
              ARMY KIDS
            </text>
            <text
              x="210"
              y="82"
              textAnchor="middle"
              fill="url(#kidsGrad)"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="24"
              letterSpacing="4"
              stroke="#064e3b"
              strokeWidth="2"
              paintOrder="stroke fill"
            >
              ADVENTURE
            </text>
          </svg>
        </div>

        {/* Animated Friendly Jeep & Mascot Display */}
        <div className="flex items-center justify-center gap-3 my-1">
          <div className="text-4xl sm:text-5xl animate-bounce" style={{ animationDuration: '2.5s' }}>
            🚙
          </div>
          <div className="text-4xl sm:text-5xl animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '200ms' }}>
            🧑‍✈️
          </div>
          <div className="text-3xl sm:text-4xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '400ms' }}>
            🐶
          </div>
        </div>

        {/* Primary START CTA Button */}
        <button
          data-start="true"
          onClick={() => {
            sound.playJump();
            onPlayGame();
          }}
          className="w-full max-w-sm py-4 mt-2 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-500 active:to-amber-700 text-emerald-950 font-black text-2xl rounded-3xl shadow-[0_8px_25px_rgba(245,158,11,0.5)] border-b-6 border-amber-800 flex items-center justify-center gap-3 transition-transform active:translate-y-1.5 active:border-b-2 cursor-pointer"
        >
          <Play size={32} className="fill-emerald-950 stroke-[3]" /> PLAY GAME!
        </button>
        <span className="text-[11px] text-emerald-300/80 mt-1 font-semibold">
          Tap or press SPACE / ENTER to start!
        </span>
      </div>

      {/* Grid Menu of Required Sections: Mini-Games, Levels, Rewards, Daily Challenge */}
      <div className="w-full max-w-xl z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        <button
          onClick={() => {
            sound.playSnap();
            onOpenMiniGames();
          }}
          className="flex flex-col items-center p-3 rounded-2xl bg-emerald-800/90 hover:bg-emerald-700/90 border-2 border-emerald-500 shadow-md active:scale-95 cursor-pointer text-white transition-all"
        >
          <Gamepad2 size={24} className="text-amber-300 mb-1" />
          <span className="font-extrabold text-xs sm:text-sm">Mini Games</span>
          <span className="text-[10px] text-emerald-200">All 8 Games</span>
        </button>

        <button
          onClick={() => {
            sound.playSnap();
            onOpenLevelSelect();
          }}
          className="flex flex-col items-center p-3 rounded-2xl bg-emerald-800/90 hover:bg-emerald-700/90 border-2 border-emerald-500 shadow-md active:scale-95 cursor-pointer text-white transition-all"
        >
          <Map size={24} className="text-teal-300 mb-1" />
          <span className="font-extrabold text-xs sm:text-sm">Select Level</span>
          <span className="text-[10px] text-emerald-200">20 Missions</span>
        </button>

        <button
          onClick={() => {
            sound.playSnap();
            onOpenRewards();
          }}
          className="flex flex-col items-center p-3 rounded-2xl bg-emerald-800/90 hover:bg-emerald-700/90 border-2 border-emerald-500 shadow-md active:scale-95 cursor-pointer text-white transition-all"
        >
          <Award size={24} className="text-yellow-300 mb-1" />
          <span className="font-extrabold text-xs sm:text-sm">Rewards</span>
          <span className="text-[10px] text-emerald-200">Badges & Gear</span>
        </button>

        <button
          onClick={() => {
            sound.playSnap();
            onOpenDailyChallenge();
          }}
          className="flex flex-col items-center p-3 rounded-2xl bg-emerald-800/90 hover:bg-emerald-700/90 border-2 border-emerald-500 shadow-md active:scale-95 cursor-pointer text-white transition-all"
        >
          <Calendar size={24} className="text-orange-300 mb-1" />
          <span className="font-extrabold text-xs sm:text-sm">Daily Quest</span>
          <span className="text-[10px] text-emerald-200">Streak Bonus</span>
        </button>
      </div>

      {/* Parent Area & Privacy Footer (Gated by math challenge for child protection) */}
      <div className="w-full max-w-xl z-10 flex items-center justify-between pt-2 border-t border-emerald-800/80 text-xs">
        <button
          onClick={onOpenPrivacyPolicy}
          className="flex items-center gap-1.5 text-emerald-300 hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-900/60"
        >
          <FileText size={15} /> Privacy Policy
        </button>

        <button
          onClick={onOpenParentSettings}
          className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-amber-300 px-3 py-1.5 rounded-xl font-bold cursor-pointer active:scale-95"
        >
          <Shield size={15} /> Parents & Settings
        </button>
      </div>
    </div>
  );
};
