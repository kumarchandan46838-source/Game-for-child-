import React, { useState } from 'react';
import { PlayerProfile, AchievementBadge } from '../../types/game';
import { evaluateBadgeUnlocks } from '../../game/logic';
import { sound } from '../../utils/audio';
import { X, Award, User, Truck, Check, Lock } from 'lucide-react';

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onClose: () => void;
}

const ALL_BADGES: AchievementBadge[] = [
  {
    id: 'cadet_recruit',
    title: 'Cadet Recruit',
    description: 'Enlisted in Army Kids Adventure training!',
    icon: '🎖️',
    unlocked: true,
    rewardCoins: 10,
  },
  {
    id: 'star_gatherer',
    title: 'Star Gatherer',
    description: 'Earned at least 5 stars across training courses.',
    icon: '⭐',
    unlocked: false,
    rewardCoins: 30,
  },
  {
    id: 'star_champion',
    title: 'Star Champion',
    description: 'Earned 20 stars from excellent mission performance!',
    icon: '🌟',
    unlocked: false,
    rewardCoins: 60,
  },
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Gathered over 100 shiny gold coins.',
    icon: '🪙',
    unlocked: false,
    rewardCoins: 40,
  },
  {
    id: 'camp_scout',
    title: 'Camp Scout',
    description: 'Completed 5 levels across different mini-games.',
    icon: '🏕️',
    unlocked: false,
    rewardCoins: 50,
  },
  {
    id: 'patrol_leader',
    title: 'Patrol Leader',
    description: 'Reached Level 10 and mastered tough courses.',
    icon: '🧭',
    unlocked: false,
    rewardCoins: 75,
  },
  {
    id: 'master_commander',
    title: 'Master Commander',
    description: 'Completed all 20 adventure levels!',
    icon: '🏆',
    unlocked: false,
    rewardCoins: 150,
  },
];

const CHARACTERS = [
  { id: 'Leo', name: 'Cadet Leo', cost: 0, icon: '🧑‍✈️', desc: 'Courageous camp squad leader' },
  { id: 'Bella', name: 'Scout Bella', cost: 80, icon: '👩‍✈️', desc: 'Speedy runner & jungle expert' },
  { id: 'Teddy', name: 'Sgt. Teddy', cost: 120, icon: '🐻', desc: 'Brave and cheerful tactical bear' },
  { id: 'Maya', name: 'Pilot Maya', cost: 160, icon: '👩‍✈️', desc: 'High-flying rescue helicopter ace' },
];

const VEHICLES = [
  { id: 'GreenJeep', name: 'Forest Green Jeep', cost: 0, icon: '🚙', desc: 'Classic camo army explorer' },
  { id: 'DesertJeep', name: 'Desert Dune Cruiser', cost: 100, icon: '🚙', desc: 'Built for sand & high speed' },
  { id: 'RescueJeep', name: 'Red Rescue Jeep', cost: 140, icon: '🚨', desc: 'Equipped with rescue beacons' },
  { id: 'TigerJeep', name: 'Tiger Stripe Rover', cost: 180, icon: '🐅', desc: 'Fierce and fun tiger paint job' },
];

export const RewardsModal: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'characters' | 'vehicles'>('badges');

  const totalStars = Object.values(profile.levelStars).reduce((a, b) => a + b, 0);
  const earnedBadgeIds = evaluateBadgeUnlocks({
    coins: profile.coins,
    stars: totalStars,
    completedLevels: profile.unlockedLevel,
    miniGamesPlayed: 8,
  });

  const handleUnlockCharacter = (char: typeof CHARACTERS[0]) => {
    if (profile.unlockedCustomizations.includes(char.id)) {
      // Just activate
      onUpdateProfile({ activeCharacter: char.id as any });
      sound.playSnap();
    } else if (profile.coins >= char.cost) {
      // Purchase with earned coins
      sound.playCoin();
      onUpdateProfile({
        coins: profile.coins - char.cost,
        unlockedCustomizations: [...profile.unlockedCustomizations, char.id],
        activeCharacter: char.id as any,
      });
    } else {
      sound.playTryAgain();
    }
  };

  const handleUnlockVehicle = (veh: typeof VEHICLES[0]) => {
    if (profile.unlockedCustomizations.includes(veh.id)) {
      onUpdateProfile({ activeVehicle: veh.id as any });
      sound.playSnap();
    } else if (profile.coins >= veh.cost) {
      sound.playCoin();
      onUpdateProfile({
        coins: profile.coins - veh.cost,
        unlockedCustomizations: [...profile.unlockedCustomizations, veh.id],
        activeVehicle: veh.id as any,
      });
    } else {
      sound.playTryAgain();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 border-4 border-amber-400 rounded-3xl p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                Rewards & Locker
              </h2>
              <div className="flex items-center gap-3 text-xs text-emerald-200 mt-0.5">
                <span>Coins: 🪙 <strong className="text-yellow-300">{profile.coins}</strong></span>
                <span>Stars: ⭐ <strong className="text-amber-300">{totalStars}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-2xl border border-emerald-600 text-white cursor-pointer"
            aria-label="Close Rewards"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <button
            onClick={() => setActiveTab('badges')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer
              ${
                activeTab === 'badges'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800'
              }`}
          >
            <Award size={16} /> Badges
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer
              ${
                activeTab === 'characters'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800'
              }`}
          >
            <User size={16} /> Cadets
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer
              ${
                activeTab === 'vehicles'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800'
              }`}
          >
            <Truck size={16} /> Jeeps
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_BADGES.map((badge) => {
                const isEarned = earnedBadgeIds.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all
                      ${
                        isEarned
                          ? 'bg-emerald-800/80 border-amber-400 shadow-md'
                          : 'bg-emerald-950/60 border-emerald-900/60 opacity-60'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 flex items-center justify-center text-2xl border border-emerald-700">
                      {isEarned ? badge.icon : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-amber-200 truncate">
                          {badge.title}
                        </span>
                        {isEarned && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">
                            EARNED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-100 mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHARACTERS.map((char) => {
                const isUnlocked = profile.unlockedCustomizations.includes(char.id);
                const isActive = profile.activeCharacter === char.id;
                const canAfford = profile.coins >= char.cost;

                return (
                  <div
                    key={char.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2
                      ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 shadow-lg'
                          : isUnlocked
                          ? 'bg-emerald-800/80 border-emerald-600'
                          : 'bg-emerald-950/70 border-emerald-900'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{char.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{char.name}</h4>
                        <p className="text-[11px] text-emerald-200">{char.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnlockCharacter(char)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1
                        ${
                          isActive
                            ? 'bg-amber-400 text-emerald-950'
                            : isUnlocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : canAfford
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-black'
                            : 'bg-emerald-900/60 text-emerald-400 opacity-60'
                        }`}
                    >
                      {isActive ? (
                        <>
                          <Check size={14} /> Active
                        </>
                      ) : isUnlocked ? (
                        'Select'
                      ) : (
                        `🪙 ${char.cost}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VEHICLES.map((veh) => {
                const isUnlocked = profile.unlockedCustomizations.includes(veh.id);
                const isActive = profile.activeVehicle === veh.id;
                const canAfford = profile.coins >= veh.cost;

                return (
                  <div
                    key={veh.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2
                      ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 shadow-lg'
                          : isUnlocked
                          ? 'bg-emerald-800/80 border-emerald-600'
                          : 'bg-emerald-950/70 border-emerald-900'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{veh.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{veh.name}</h4>
                        <p className="text-[11px] text-emerald-200">{veh.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnlockVehicle(veh)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1
                        ${
                          isActive
                            ? 'bg-amber-400 text-emerald-950'
                            : isUnlocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : canAfford
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-black'
                            : 'bg-emerald-900/60 text-emerald-400 opacity-60'
                        }`}
                    >
                      {isActive ? (
                        <>
                          <Check size={14} /> Active
                        </>
                      ) : isUnlocked ? (
                        'Select'
                      ) : (
                        `🪙 ${veh.cost}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="pt-2 border-t border-emerald-800 text-center text-[11px] text-emerald-300">
          All items are earned 100% through gameplay. No real-money purchases or loot boxes.
        </div>
      </div>
    </div>
  );
};
