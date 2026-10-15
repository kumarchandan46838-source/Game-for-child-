import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../../types/game';
import { calculateStars } from '../../game/logic';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, X, Sparkles } from 'lucide-react';

interface Props {
  level: LevelConfig;
  onVictory: (stars: number, score: number, coins: number) => void;
  onGameOver: (reason: 'lives' | 'timeout' | 'moves', score: number, progressPct: number) => void;
  onExit: () => void;
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
  const [matchesFound, setMatchesFound] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

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
    setMatchesFound(0);
    setIsLocked(false);
  };

  useEffect(() => {
    initGame();
  }, [level]);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
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
        // NO MATCH
        setTimeout(() => {
          sound.playTryAgain();
          newCards[firstIdx].flipped = false;
          newCards[secondIdx].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
          setIsLocked(false);

          // Check if max moves reached without finding all pairs -> GAME OVER!
          if (newMoves >= maxMoves) {
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
          <div className="flex items-center gap-1.5 bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-lg text-amber-300">
              {matchesFound} / {numPairs} Pairs
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-500/30 px-3 py-1 rounded-xl border border-blue-400">
            <span className="text-xs sm:text-sm font-semibold text-blue-200">Moves:</span>
            <span className="font-bold text-sm sm:text-base text-white">{moves} / {maxMoves}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={initGame}
            className="p-2 bg-blue-800 hover:bg-blue-700 active:scale-95 rounded-xl border border-blue-600"
            aria-label="Restart Mission"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-red-700/80 hover:bg-red-600 active:scale-95 rounded-xl border border-red-500"
            aria-label="Exit Game"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Title clue */}
      <div className="w-full max-w-2xl text-center py-1">
        <span className="inline-flex items-center gap-2 bg-blue-900/80 px-4 py-1.5 rounded-full border border-blue-500 text-blue-100 font-bold text-sm shadow-md">
          <Sparkles size={16} className="text-amber-400" />
          Find all {numPairs} matching cartoon cadet pairs!
        </span>
      </div>

      {/* Card Grid */}
      <div className="relative w-full max-w-lg flex-1 flex items-center justify-center p-2">
        <div
          className={`grid ${
            numPairs === 3 ? 'grid-cols-3' : 'grid-cols-4'
          } gap-3 sm:gap-4 w-full p-4 bg-indigo-900/80 rounded-3xl border-4 border-blue-600 shadow-2xl`}
        >
          {cards.map((card, idx) => {
            const isRevealed = card.flipped || card.matched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={isRevealed || isLocked}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-md border-b-4
                  ${
                    card.matched
                      ? 'bg-emerald-600 border-emerald-800 scale-95 opacity-90'
                      : isRevealed
                      ? 'bg-amber-400 border-amber-600 scale-105'
                      : 'bg-blue-600 hover:bg-blue-500 border-blue-900 cursor-pointer'
                  }`}
              >
                {isRevealed ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl sm:text-5xl">{card.emoji}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-900 mt-1">
                      {card.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl text-blue-300 opacity-90">⭐</span>
                    <span className="text-[10px] font-extrabold text-blue-200 mt-1 uppercase">
                      CADET
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="w-full max-w-md text-center text-xs text-blue-300 font-medium pb-2">
        Tip: Remember where each gear card is placed to find pairs faster!
      </div>
    </div>
  );
};
