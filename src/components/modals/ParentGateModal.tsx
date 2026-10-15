import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { validateParentMathGate } from '../../game/logic';
import { sound } from '../../utils/audio';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export const ParentGateModal: React.FC<Props> = ({
  onSuccess,
  onCancel,
  title = 'Grown-Ups Only',
}) => {
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(8);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  useEffect(() => {
    // Generate random numbers between 6 and 14
    setNumA(Math.floor(Math.random() * 9) + 6);
    setNumB(Math.floor(Math.random() * 9) + 6);
    setInputVal('');
    setErrorMsg(false);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(inputVal, 10);
    if (validateParentMathGate(numA, numB, answer)) {
      sound.playSnap();
      onSuccess();
    } else {
      sound.playTryAgain();
      setErrorMsg(true);
      setInputVal('');
      // regenerate numbers
      setNumA(Math.floor(Math.random() * 9) + 6);
      setNumB(Math.floor(Math.random() * 9) + 6);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/80 rounded-3xl p-6 text-white shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-stone-800"
          aria-label="Close Parent Gate"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-3">
            <ShieldAlert size={28} />
          </div>

          <h3 className="text-2xl font-black text-amber-300">{title}</h3>
          <p className="text-xs text-stone-300 mt-1 max-w-[260px]">
            Please ask a parent or guardian to solve this math problem to continue:
          </p>

          <form onSubmit={handleVerify} className="w-full mt-4 flex flex-col items-center">
            <div className="text-2xl font-mono font-bold text-white bg-stone-800 px-5 py-3 rounded-2xl border border-stone-700 mb-3 tracking-wide">
              {numA} + {numB} = ?
            </div>

            <input
              type="number"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(false);
              }}
              placeholder="Enter answer"
              autoFocus
              className="w-full text-center text-xl font-bold py-3 px-4 bg-stone-900 border-2 border-stone-600 rounded-2xl text-amber-300 focus:outline-none focus:border-amber-400 mb-2"
            />

            {errorMsg && (
              <span className="text-xs text-rose-400 font-bold mb-2">
                Incorrect answer. Please try again!
              </span>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black text-base rounded-2xl shadow-lg border-b-4 border-amber-900 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Check size={20} className="stroke-[3]" /> Unlock Parent Area
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
