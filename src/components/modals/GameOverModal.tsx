import React, { useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { RotateCcw, Home, HeartCrack, Clock, Skull, AlertTriangle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  level: LevelConfig;
  reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed';
  score: number;
  progressPercent: number;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  level,
  reason,
  score,
  progressPercent,
  onRetry,
  onHome,
}) => {
  useEffect(() => {
    sound.playGameOver();
  }, []);

  const getReasonInfo = () => {
    switch (reason) {
      case 'lives':
        return {
          title: 'आउट! सारे हार्ट खत्म हो गए! 💔',
          subtitle: 'Out! No Lives Remaining',
          badge: 'No Hearts Left',
          desc: 'Your cadet lost all 3 hearts from hitting obstacles. Jump or slide to stay safe next time!',
        };
      case 'timeout':
        return {
          title: 'आउट! टाइम खत्म हो गया! ⏳',
          subtitle: 'Out! Time Expired',
          badge: 'Time Out',
          desc: 'The mission clock ran down to zero before you reached the goal. Move faster next time!',
        };
      case 'moves':
        return {
          title: 'आउट! सारे कदम खत्म हो गए! 🐾',
          subtitle: 'Out! No Steps Left',
          badge: 'Out of Steps',
          desc: 'You used up all allowed moves! Plan a shorter path around boulders to reach camp.',
        };
      case 'mistakes':
        return {
          title: 'आउट! गलत मैच हो गए! ❌',
          subtitle: 'Out! Too Many Mistakes',
          badge: '3 Strikes',
          desc: 'You made 3 wrong guesses! Remember the cards carefully to find matching pairs.',
        };
      case 'crashed':
        return {
          title: 'आउट! जीप क्रैश हो गई! 💥',
          subtitle: 'Out! Jeep Crashed',
          badge: 'Vehicle Crashed',
          desc: 'Your jeep hit too many road hazards! Steer smoothly between lanes to keep rolling.',
        };
      default:
        return {
          title: 'आउट! कोशिश अच्छी थी! 💔',
          subtitle: 'Out! Game Over',
          badge: 'Mission Failed',
          desc: 'You ran out of lives! Tap TRY AGAIN to master this mission.',
        };
    }
  };

  const info = getReasonInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-stone-900 via-stone-950 to-red-950 border-4 border-rose-500 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-block bg-rose-500/30 border border-rose-400/60 px-4 py-1.5 rounded-full text-rose-300 font-black text-xs tracking-wider uppercase mb-2">
          {info.badge}
        </div>

        {/* Mascot Defeat & Heart Crack */}
        <div className="flex items-center justify-center gap-2 my-2 text-5xl">
          <span className="animate-pulse">💔</span>
          <span className="text-4xl">😵</span>
          <span className="animate-pulse">💔</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-rose-400 drop-shadow-md">
          {info.title}
        </h2>
        <div className="text-stone-300 font-extrabold text-sm mt-1">
          {info.subtitle} • {level.name}
        </div>

        <p className="text-xs text-rose-200/90 mt-2 bg-stone-950/80 p-3 rounded-2xl border border-rose-900/80 leading-relaxed">
          {info.desc}
        </p>

        {/* Progress Metrics */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-stone-900/90 border border-stone-700 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-stone-400 font-semibold">Course Progress</span>
            <span className="text-2xl font-black text-amber-400 mt-1">
              {progressPercent}%
            </span>
          </div>
          <div className="bg-stone-900/90 border border-stone-700 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-stone-400 font-semibold">Mission Score</span>
            <span className="text-2xl font-black text-white mt-1">
              {score}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            data-start="true"
            onClick={onRetry}
            className="w-full py-4 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-500 active:to-amber-700 text-stone-950 font-black text-xl rounded-2xl shadow-xl border-b-4 border-amber-800 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1 active:border-b-0"
          >
            <RotateCcw size={22} className="stroke-[3]" /> TRY AGAIN! (फिर से खेलें)
          </button>

          <button
            onClick={onHome}
            className="w-full py-3 bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-200 font-bold rounded-2xl border border-stone-600 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={18} /> Main Menu (मेनू)
          </button>
        </div>
      </div>
    </div>
  );
};
