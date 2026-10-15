import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, X, Sparkles, Skull } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed', score: number, progressPct: number) => void;
  onExit: () => void;
  onRestart?: () => void;
}

interface CardItem {
  id: number;
  emoji: string;
  name: string;
  matched: boolean;
  flipped: boolean;
}

const ALL_CARDS = [
  { emoji: '🚙', name: 'Army Jeep' },
  { emoji: '🚁', name: 'Rescue Copter' },
  { emoji: '🎖️', name: 'Star Medal' },
  { emoji: '🧢', name: 'Cadet Cap' },
  { emoji: '📻', name: 'Walkie Talkie' },
  { emoji: '🧭', name: 'Camp Compass' },
  { emoji: '🪂', name: 'Parachute' },
  { emoji: '🐶', name: 'Camp Rover' },
];

export const MemoryMissionGame: React.FC<Props> = ({ level, onVictory, onGameOver, onExit }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lives, setLives] = useState(3);
  const [matchesFound, setMatchesFound] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const numPairs = level.id >= 14 ? 4 : 3;
  const maxMoves = numPairs === 3 ? 12 : 16;

  const initGame = () => {
    const selected = ALL_CARDS.slice(0, numPairs);
    const deck: CardItem[] = [];

    selected.forEach((item, index) => {
      deck.push({
        id: index * 2,
        emoji: item.emoji,
        name: item.name,
        matched: false,
        flipped: false,
      });
      deck.push({
        id: index * 2 + 1,
        emoji: item.emoji,
        name: item.name,
        matched: false,
        flipped: false,
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setLives(3);
    setMatchesFound(0);
    setIsLocked(false);
    setIsFinished(false);
  };

  useEffect(() => {
    initGame();
  }, [level]);

  // Immediate Out trigger
  const triggerManualOut = () => {
    if (isFinished) return;
    setIsFinished(true);
    setLives(0);
    sound.playGameOver();
    const pct = Math.min(90, Math.floor((matchesFound / numPairs) * 100));
    onGameOver('mistakes', matchesFound * 25, pct);
  };

  const handleCardClick = (index: number) => {
    if (isLocked || isFinished) return;
    const card = cards[index];
    if (card.matched || card.flipped) return;

    sound.playCardFlip();

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.emoji === secondCard.emoji) {
        // MATCH!
        setTimeout(() => {
          sound.playStar();
          newCards[firstIdx].matched = true;
          newCards[secondIdx].matched = true;
          setCards(newCards);
          setFlippedIndices([]);
          setIsLocked(false);
          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          // Check Win condition
          if (nextMatches >= numPairs) {
            setIsFinished(true);
            const score = 150 - newMoves * 6;
            const earnedStars = calculateStars(score, level.targetStarsScore);
            sound.playVictory();
            try {
              confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
            } catch {}
            setTimeout(() => {
              onVictory(earnedStars, score, 20);
            }, 1200);
          }
        }, 500);
      } else {
        // NO MATCH - Deduct a Heart!
        setTimeout(() => {
          sound.playTryAgain();
          newCards[firstIdx].flipped = false;
          newCards[secondIdx].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
          setIsLocked(false);

          const nextLives = lives - 1;
          setLives(nextLives);

          // Check if out of lives (3 wrong guesses) -> GAME OVER!
          if (nextLives <= 0) {
            setIsFinished(true);
            sound.playGameOver();
            const pct = Math.min(90, Math.floor((matchesFound / numPairs) * 100));
            setTimeout(() => {
              onGameOver('mistakes', matchesFound * 25, pct);
            }, 600);
            return;
          }

          // Check if max moves reached without finding all pairs -> GAME OVER!
          if (newMoves >= maxMoves) {
            setIsFinished(true);
            sound.playGameOver();
            const pct = Math.min(90, Math.floor((matchesFound / numPairs) * 100));
            setTimeout(() => {
              onGameOver('moves', matchesFound * 25, pct);
            }, 600);
          }
        }, 850);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-blue-950 p-2 sm:p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-2xl bg-blue-900/90 border-2 border-blue-600 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg text-white">
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
              {matchesFound} / {numPairs} Pairs
            </span>
          </div>

          <div className="flex items-center gap-1 bg-sky-500/20 px-2.5 py-1 rounded-xl border border-sky-400/40">
            <span className="text-sm">🔄</span>
            <span className="font-bold text-sm text-sky-200">
              {maxMoves - moves} moves left
            </span>
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
            onClick={initGame}
            className="p-2 bg-blue-800 hover:bg-blue-700 active:scale-95 rounded-xl border border-blue-600 cursor-pointer"
            aria-label="Restart Memory Game"
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

      {/* Cards Grid */}
      <div className="relative w-full max-w-md flex-1 flex flex-col items-center justify-center p-2">
        <div className="text-blue-200 font-extrabold text-xs mb-3">
          Find all matching army pairs! Avoid 3 wrong guesses to stay in mission!
        </div>

        <div
          className={`grid gap-3 w-full ${
            numPairs === 3 ? 'grid-cols-3 max-w-sm' : 'grid-cols-4 max-w-md'
          }`}
        >
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl font-bold shadow-xl border-4 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                card.matched
                  ? 'bg-emerald-600/80 border-emerald-400 opacity-90 scale-95'
                  : card.flipped
                  ? 'bg-amber-400 border-amber-300 text-stone-900 rotate-y-180'
                  : 'bg-gradient-to-b from-blue-700 to-indigo-900 border-blue-400 hover:border-amber-300 text-amber-300 hover:scale-105'
              }`}
            >
              {card.flipped || card.matched ? (
                <>
                  <span className="text-4xl drop-shadow-md animate-in zoom-in duration-200">
                    {card.emoji}
                  </span>
                  <span className="text-[10px] font-bold text-stone-800 mt-1 line-clamp-1">
                    {card.name}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-blue-300">
                  <Sparkles size={28} className="text-amber-400 animate-pulse" />
                  <span className="text-xs font-black text-amber-200 mt-1">★</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Helper */}
      <div className="w-full max-w-md bg-blue-900/60 border border-blue-700/80 px-4 py-2 rounded-2xl text-center text-xs text-blue-200 mb-2">
        💡 Tip: Remember where each vehicle and tool is hidden!
      </div>
    </div>
  );
};
