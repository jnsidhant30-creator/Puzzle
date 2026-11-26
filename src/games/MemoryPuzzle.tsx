import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';
import {
  RefreshCw,
  Eye,
  Circle,
  Square,
  Triangle,
  Diamond,
  Hexagon,
  Star,
  Heart,
  Moon,
  Sun,
  Shield,
  Anchor,
  Compass
} from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

const SYMBOL_KEYS = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'hexagon',
  'star',
  'heart',
  'moon',
  'sun',
  'shield',
  'anchor',
  'compass'
] as const;

type SymbolKey = typeof SYMBOL_KEYS[number];

const renderSymbol = (key: SymbolKey) => {
  const iconProps = { className: 'w-6 h-6 sm:w-7 sm:h-7' };
  switch (key) {
    case 'circle': return <Circle {...iconProps} />;
    case 'square': return <Square {...iconProps} />;
    case 'triangle': return <Triangle {...iconProps} />;
    case 'diamond': return <Diamond {...iconProps} />;
    case 'hexagon': return <Hexagon {...iconProps} />;
    case 'star': return <Star {...iconProps} />;
    case 'heart': return <Heart {...iconProps} />;
    case 'moon': return <Moon {...iconProps} />;
    case 'sun': return <Sun {...iconProps} />;
    case 'shield': return <Shield {...iconProps} />;
    case 'anchor': return <Anchor {...iconProps} />;
    case 'compass': return <Compass {...iconProps} />;
  }
};

interface Card {
  id: number;
  symbol: SymbolKey;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useGameTimer(isPaused, isWon);

  const cardCount = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const initGame = () => {
    const selected = SYMBOL_KEYS.slice(0, cardCount / 2);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((symbol, id) => ({ id, symbol, isFlipped: false, isMatched: false }));

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setTimer(0);
    setIsWon(false);
  };

  const handleCardClick = (index: number) => {
    if (isWon || isPeeking || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;
    sound.playClick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newCards[firstIdx].symbol === newCards[secondIdx].symbol) {
        sound.playSuccess();
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);

        if (newCards.every(c => c.isMatched)) {
          setIsWon(true);
          const score = Math.max(100, 1000 - moves * 20 - timer * 10);
          setTimeout(() => onComplete(score, timer, true), 800);
        }
      } else {
        sound.playError();
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const handlePeekHint = () => {
    if (isWon || isPeeking || hintsLeft <= 0) return;
    if (useHint()) {
      sound.playClick();
      setIsPeeking(true);
      const peekCards = cards.map(c => ({ ...c, isFlipped: true }));
      setCards(peekCards);
      setTimeout(() => {
        setCards(prev => prev.map(c => ({ ...c, isFlipped: c.isMatched })));
        setFlippedIndices([]);
        setIsPeeking(false);
      }, 1500);
    }
  };

  const gridCols =
    cardCount <= 8
      ? 'grid-cols-4'
      : cardCount <= 12
      ? 'grid-cols-3 sm:grid-cols-4'
      : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Moves', value: moves },
          { label: 'Timer', value: `${timer}s` },
          { label: 'Matched', value: `${cards.filter(c => c.isMatched).length / 2} / ${cardCount / 2}`, tone: 'success' },
        ]}
      />

      {/* Cards Grid */}
      <div className={`grid ${gridCols} gap-2.5 w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-4 sm:p-5 mb-5`}>
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;

          let cardStyle = 'bg-[#233D4A] border-[#36515F] hover:border-[#4A6A7B] text-[#98AAB8] pv-keycap';
          if (card.isMatched) {
            cardStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300';
          } else if (card.isFlipped) {
            cardStyle = 'bg-[#1C2D3B] border-[#38C6BA] text-[#A8E5D5]';
          }

          return (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              disabled={card.isMatched || isPeeking}
              className={`aspect-square rounded-lg flex items-center justify-center border transition-all duration-150 select-none ${cardStyle}`}
              aria-label={isRevealed ? `Card ${card.symbol}` : 'Hidden Card'}
            >
              {isRevealed ? (
                renderSymbol(card.symbol)
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-pv-border-strong" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={handlePeekHint}
          disabled={isPeeking || hintsLeft <= 0}
          className="flex-1 h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-3.5 h-3.5" /> Peek Cards ({hintsLeft})
        </button>
        <button
          onClick={initGame}
          className="h-9 px-3 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          title="Reset Cards"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
};
