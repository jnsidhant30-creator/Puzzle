import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { GameHudBar } from '../components/ui/GameHudBar';
import { useGameTimer } from '../hooks/useGameTimer';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
  isPaused?: boolean;
}

interface Riddle {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const RIDDLES_EASY: Riddle[] = [
  { question: 'Which word does NOT belong in the group?', options: ['Apple', 'Banana', 'Carrot', 'Grape'], correctIndex: 2, explanation: 'Carrot is a root vegetable, whereas the others are botanical fruits.' },
  { question: 'If a triangle has 3 sides and a square has 4, how many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: 'A regular hexagon has exactly 6 sides.' },
  { question: 'Look at this sequence: 2, 4, 8, 16, __. What number comes next?', options: ['20', '24', '32', '64'], correctIndex: 2, explanation: 'Each subsequent number is multiplied by 2.' },
  { question: 'What month of the year has 28 days?', options: ['February only', 'February and March', 'All 12 months', 'None of them'], correctIndex: 2, explanation: 'Every single month has at least 28 days.' },
  { question: 'If you have 4 apples and take away 3, how many apples do you have?', options: ['1', '3', '4', '7'], correctIndex: 1, explanation: 'You took 3 apples with you, so you currently have 3.' }
];

const RIDDLES_MEDIUM: Riddle[] = [
  { question: 'A physician gives you 3 pills and instructs you to take one every 30 minutes. How long will the pills last?', options: ['30 minutes', '60 minutes', '90 minutes', '120 minutes'], correctIndex: 1, explanation: 'Pill 1 is taken at minute 0, pill 2 at minute 30, and pill 3 at minute 60.' },
  { question: 'If 5 cats can catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?', options: ['5', '20', '50', '100'], correctIndex: 0, explanation: '5 cats catch 1 mouse every minute on average. In 100 minutes, 5 cats catch 100 mice.' },
  { question: 'Which number completes the pattern? 3 -> 9, 4 -> 16, 5 -> 25, 6 -> ?', options: ['30', '32', '36', '42'], correctIndex: 2, explanation: 'Each value is squared: 6 squared equals 36.' },
  { question: 'A bat and ball cost $1.10 together. The bat costs $1.00 more than the ball. How much does the ball cost?', options: ['$0.10', '$0.05', '$0.15', '$0.01'], correctIndex: 1, explanation: 'Ball costs $0.05 and bat costs $1.05. Their difference is $1.00 and their sum is $1.10.' },
  { question: 'I am an odd number. Take away a letter and I become even. What number am I?', options: ['Seven', 'Nine', 'Eleven', 'Three'], correctIndex: 0, explanation: 'Remove the initial S from "SEVEN" to spell "EVEN".' }
];

const RIDDLES_HARD: Riddle[] = [
  { question: "Mary's father has 5 daughters: Nana, Nene, Nini, Nono. What is the 5th daughter's name?", options: ['Nunu', 'Mary', 'Nancy', 'Nina'], correctIndex: 1, explanation: "The riddle specifies Mary's father, making Mary the 5th daughter." },
  { question: 'Two clocks are set together. One loses 1 minute per hour, the other gains 1 minute per hour. How long until they differ by 1 hour?', options: ['12 hours', '24 hours', '30 hours', '60 hours'], correctIndex: 2, explanation: 'They diverge by 2 minutes every hour. 60 divided by 2 equals 30 hours.' },
  { question: 'You are in a race and you overtake the person in second place. What position are you in now?', options: ['First', 'Second', 'Third', 'Fourth'], correctIndex: 1, explanation: 'Overtaking the second-place runner places you in second position.' },
  { question: 'A farmer must cross a river with a wolf, a goat, and cabbage. Left alone, wolf eats goat, goat eats cabbage. What crosses first?', options: ['The Wolf', 'The Goat', 'The Cabbage', 'Nothing'], correctIndex: 1, explanation: 'The goat must cross first, leaving wolf and cabbage together safely.' },
  { question: 'Three boxes are labeled "Apples", "Oranges", and "Both". All labels are wrong. Picking 1 fruit from which box determines all 3?', options: ['Apples box', 'Oranges box', 'The box labeled "Both"', 'None of them'], correctIndex: 2, explanation: 'The "Both" box cannot be mixed since its label is wrong. One fruit reveals its true content, allowing the remaining two to resolve.' },
  { question: 'If two painters can paint two rooms in two hours, how many painters are needed to paint 18 rooms in 6 hours?', options: ['3', '6', '9', '12'], correctIndex: 1, explanation: 'One painter completes one room every 2 hours (3 rooms per 6 hours). 18 / 3 = 6 painters.' }
];

export const LogicPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft, isPaused = false }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [score, setScore] = useState(0);
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintMsg, setHintMessage] = useState<string | null>(null);
  const [timer] = useGameTimer(isPaused, round === totalRounds && isAnswered, [difficulty]);

  useEffect(() => {
    loadRiddle();
  }, [round, difficulty]);

  const loadRiddle = () => {
    setSelectedIndex(null);
    setIsAnswered(false);
    setHintMessage(null);

    const bank = difficulty === 'easy' ? RIDDLES_EASY : difficulty === 'medium' ? RIDDLES_MEDIUM : RIDDLES_HARD;
    const available = bank.filter(r => !usedQuestions.includes(r.question));
    const chosenList = available.length > 0 ? available : bank;
    const item = chosenList[Math.floor(Math.random() * chosenList.length)];

    setUsedQuestions(prev => [...prev, item.question]);
    setCurrentRiddle(item);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentRiddle) return;
    setSelectedIndex(idx);
    setIsAnswered(true);

    if (idx === currentRiddle.correctIndex) {
      sound.playSuccess();
      const points = difficulty === 'easy' ? 150 : difficulty === 'medium' ? 250 : 400;
      const newScore = score + points;
      setScore(newScore);

      setTimeout(() => {
        if (round < totalRounds) {
          setRound(r => r + 1);
        } else {
          onComplete(newScore + Math.max(0, 300 - timer * 5), timer, true);
        }
      }, 1200);
    } else {
      sound.playError();
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(r => r + 1);
        } else {
          onComplete(score, timer, false);
        }
      }, 1200);
    }
  };

  const handleHint = () => {
    if (!currentRiddle || isAnswered || hintsLeft <= 0) return;
    if (useHint()) {
      sound.playClick();
      setHintMessage(`Clue: ${currentRiddle.explanation.slice(0, 45)}...`);
    }
  };

  const OPT_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
      <GameHudBar
        items={[
          { label: 'Round', value: `${round} / ${totalRounds}`, tone: 'accent' },
          { label: 'Timer', value: `${timer}s` },
          { label: 'Score', value: score, tone: 'success' },
        ]}
      />

      {/* Question Card */}
      {currentRiddle && (
        <div className="w-full bg-[#142331]/90 border border-[#36515F] rounded-xl p-5 sm:p-6 mb-5 flex flex-col">
          <p className="text-[11px] font-semibold text-pv-text-muted uppercase tracking-wider mb-2">
            Logic & Deduction
          </p>
          <p className="text-lg font-medium text-pv-text-primary leading-snug">
            {currentRiddle.question}
          </p>

          {isAnswered && (
            <div className="mt-4 p-3 bg-pv-surface-secondary border border-pv-border rounded-md text-pv-text-secondary text-xs">
              <span className="font-semibold text-pv-text-primary">Explanation:</span> {currentRiddle.explanation}
            </div>
          )}

          {hintMsg && !isAnswered && (
            <div className="mt-4 p-2.5 bg-pv-surface-secondary border border-[#38C6BA]/40 text-[#A8E5D5] rounded-md text-xs flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#38C6BA] shrink-0" />
              <span>{hintMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      {currentRiddle && (
        <div className="flex flex-col gap-2 w-full mb-5">
          {currentRiddle.options.map((opt, idx) => {
            let itemStyle = 'bg-pv-surface-primary hover:bg-pv-surface-secondary border-pv-border text-pv-text-primary';
            if (isAnswered) {
              if (idx === currentRiddle.correctIndex) {
                itemStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300';
              } else if (idx === selectedIndex) {
                itemStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
              } else {
                itemStyle = 'bg-pv-surface-primary border-pv-border text-pv-text-muted opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`h-12 px-4 rounded-lg border text-sm font-medium text-left transition-colors flex items-center justify-between ${itemStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded border border-pv-border flex items-center justify-center text-xs font-semibold text-pv-text-muted font-tabular">
                    {OPT_LABELS[idx]}
                  </span>
                  <span>{opt}</span>
                </div>
                {isAnswered && idx === currentRiddle.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {isAnswered && idx === selectedIndex && idx !== currentRiddle.correctIndex && (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Action */}
      <button
        onClick={handleHint}
        disabled={isAnswered || hintsLeft <= 0}
        className="w-full h-9 bg-pv-surface-primary hover:bg-pv-surface-secondary text-pv-text-secondary hover:text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Lightbulb className="w-3.5 h-3.5" /> Hint ({hintsLeft})
      </button>
    </div>
  );
};
