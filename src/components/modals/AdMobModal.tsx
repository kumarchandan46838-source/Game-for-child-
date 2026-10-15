import React, { useState, useEffect } from 'react';
import { ADMOB_TEST_CONFIG } from '../../utils/admob';
import { X, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const AdMobModal: React.FC<Props> = ({ onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl p-5 text-white flex flex-col items-center shadow-2xl relative">
        {/* AdMob Official Test Ad Badge */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-yellow-500/40">
            GOOGLE TEST AD
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck size={14} /> Family Rated: G
          </div>
        </div>

        {/* Ad Content Area */}
        <div className="my-5 flex flex-col items-center text-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700 w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-3xl shadow-lg mb-3">
            🎨
          </div>
          <h3 className="text-xl font-bold text-white">Cartoon Drawing Fun</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
            Color cute cartoon animals, vehicles, and super heroes! 100% kid-safe.
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            <Sparkles size={13} /> Rated E for Everyone
          </div>
        </div>

        {/* Ad Unit & Policy Verification Info */}
        <div className="w-full bg-slate-950/80 rounded-xl p-2.5 text-[10px] text-slate-400 font-mono text-center mb-4 border border-slate-800/80">
          Unit: {ADMOB_TEST_CONFIG.interstitialAdUnitId}
          <div className="text-emerald-400 font-sans font-semibold mt-0.5">
            ✓ COPPA & Google Play Families Frequency Capped
          </div>
        </div>

        {/* Close Button / Countdown */}
        {canClose ? (
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:from-emerald-600 active:to-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-lg border-b-4 border-emerald-900 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
          >
            <X size={20} /> CLOSE AD & CONTINUE
          </button>
        ) : (
          <div className="w-full py-3 bg-slate-800 text-slate-400 font-bold text-sm rounded-2xl flex items-center justify-center border border-slate-700">
            Close in {secondsRemaining}s...
          </div>
        )}
      </div>
    </div>
  );
};
