import React from 'react';
import { PlayerProfile, LevelConfig } from '../../types/game';
import { calculateDailyBonus } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { X, Calendar, Flame, Play, Check } from 'lucide-react';
import { LEVELS } from '../../game/levels';

interface Props {
  profile: PlayerProfile;
  onStartLevel: (level: LevelConfig) => void;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<Props> = ({
  profile,
  onStartLevel,
  onUpdateProfile,
  onClose,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isCompletedToday = profile.dailyChallengeDate === todayStr && profile.dailyChallengeCompleted;
  const currentStreak = profile.dailyStreak || 1;
  const bonusCoins = calculateDailyBonus(currentStreak);

  // Pick today's daily mission based on day of month
  const dayOfMonth = new Date().getDate();
  const challengeLevel = LEVELS[(dayOfMonth - 1) % LEVELS.length];

  const handleClaimDailyReward = () => {
    if (isCompletedToday) return;
    sound.playVictory();
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {}
    onUpdateProfile({
      coins: profile.coins + bonusCoins,
      stars: profile.stars + 1,
      dailyChallengeDate: todayStr,
      dailyChallengeCompleted: true,
      dailyStreak: currentStreak + 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-orange-900 to-emerald-950 border-4 border-amber-400 rounded-3xl p-6 text-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-orange-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📅</span>
            <div>
              <h2 className="text-2xl font-black text-amber-300">Daily Cadet Quest</h2>
              <p className="text-xs text-orange-200">Play every day to earn streak bonuses!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-orange-950 hover:bg-orange-800 active:scale-95 rounded-2xl border border-orange-700 text-white cursor-pointer"
            aria-label="Close Daily Challenge"
          >
            <X size={20} />
          </button>
        </div>

        {/* Streak Counter */}
        <div className="my-4 p-4 bg-orange-950/80 rounded-2xl border-2 border-orange-600/80 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl border border-amber-500/40">
              <Flame size={26} className="text-orange-400 fill-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-orange-200 font-semibold">Training Streak</div>
              <div className="text-2xl font-black text-white">{currentStreak} Days</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-orange-200 font-semibold">Today's Reward</div>
            <div className="text-lg font-black text-yellow-300">🪙 +{bonusCoins}</div>
          </div>
        </div>

        {/* Today's Special Mission Card */}
        <div className="bg-emerald-900/80 border-2 border-emerald-600 rounded-2xl p-4 my-3 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{challengeLevel.icon}</span>
            <div>
              <h4 className="font-extrabold text-base text-amber-300">
                {challengeLevel.name}
              </h4>
              <span className="text-[11px] text-emerald-200">
                {challengeLevel.subtitle}
              </span>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-2 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800">
            {challengeLevel.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            onClick={() => {
              onClose();
              onStartLevel(challengeLevel);
            }}
            className="w-full py-3.5 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-black text-lg rounded-2xl shadow-xl border-b-4 border-amber-800 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
          >
            <Play size={20} className="fill-emerald-950" /> LAUNCH TODAY'S MISSION
          </button>

          {!isCompletedToday ? (
            <button
              onClick={handleClaimDailyReward}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl border-2 border-emerald-500 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              🎁 Claim Daily Bonus (+{bonusCoins} Coins)
            </button>
          ) : (
            <div className="py-2.5 bg-emerald-950/80 rounded-2xl text-emerald-300 text-xs font-bold border border-emerald-800 flex items-center justify-center gap-1.5">
              <Check size={16} /> Daily reward already claimed today!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
