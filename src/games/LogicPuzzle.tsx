import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { sound } from '../services/sound';
import { HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
  onComplete: (score: number, timeSeconds: number, won: boolean) => void;
  useHint: () => boolean;
  hintsLeft: number;
}

interface Riddle {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const RIDDLES_EASY: Riddle[] = [
  { question: 'Which word does NOT belong in the group?', options: ['Apple', 'Banana', 'Carrot', 'Grape'], correctIndex: 2, explanation: 'Carrot is a vegetable, while the others are fruits.' },
  { question: 'If a triangle has 3 sides and a square has 4, how many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: 'A hexagon has 6 sides.' },
  { question: 'Look at this series: 2, 4, 8, 16, __. What number comes next?', options: ['20', '24', '32', '64'], correctIndex: 2, explanation: 'Each number is doubled (multiplied by 2).' },
  { question: 'What month of the year has 28 days?', options: ['February only', 'February and March', 'All 12 months', 'None of them'], correctIndex: 2, explanation: 'Every single month has at least 28 days!' },
  { question: 'If you have 4 apples and take away 3, how many apples do YOU have?', options: ['1', '3', '4', '7'], correctIndex: 1, explanation: 'You took 3 apples, so you have 3!' }
];

const RIDDLES_MEDIUM: Riddle[] = [
  { question: 'A doctor gives you 3 pills and tells you to take one every 30 minutes. How long will the pills last?', options: ['30 minutes', '60 minutes', '90 minutes', '120 minutes'], correctIndex: 1, explanation: 'You take 1st pill at 0m, 2nd pill at 30m, and 3rd pill at 60m (total 60 mins).' },
  { question: 'If 5 cats can catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?', options: ['5', '20', '50', '100'], correctIndex: 0, explanation: '5 cats catch 5 mice in 5 minutes (1 mouse per min). So 5 cats catch 100 mice in 100 mins!' },
  { question: 'Which number completes the pattern? 3 -> 9, 4 -> 16, 5 -> 25, 6 -> ?', options: ['30', '32', '36', '42'], correctIndex: 2, explanation: 'The pattern squares the input number (6 * 6 = 36).' },
  { question: 'A bat and ball cost $1.10 together. The bat costs $1.00 more than the ball. How much does the ball cost?', options: ['$0.10', '$0.05', '$0.15', '$0.01'], correctIndex: 1, explanation: 'Ball = $0.05, Bat = $1.05. Total = $1.10, and difference is $1.00!' },
  { question: 'I am an odd number. Take away a letter and I become even. What number am I?', options: ['Seven', 'Nine', 'Eleven', 'Three'], correctIndex: 0, explanation: 'Remove the letter S from "SEVEN" and it spells "EVEN"!' }
];

const RIDDLES_HARD: Riddle[] = [
  { question: "Mary's father has 5 daughters: Nana, Nene, Nini, Nono. What is the 5th daughter's name?", options: ['Nunu', 'Mary', 'Nancy', 'Nina'], correctIndex: 1, explanation: "It is Mary's father, so the 5th daughter is Mary!" },
  { question: 'There are two clocks. One loses 1 minute per hour, the other gains 1 minute per hour. If they are set together, how long until they differ by 1 hour?', options: ['12 hours', '24 hours', '30 hours', '60 hours'], correctIndex: 2, explanation: 'In 1 hour, they diverge by 2 minutes. 60 / 2 = 30 hours.' },
  { question: 'You are in a race and you overtake the person in second place. What position are you in now?', options: ['First', 'Second', 'Third', 'Fourth'], correctIndex: 1, explanation: 'You passed the person in second place, taking their spot: second place!' },
  { question: 'A farmer needs to cross a river with a wolf, a goat, and a cabbage. If left alone, wolf eats goat, goat eats cabbage. What does the farmer take across first?', options: ['The Wolf', 'The Goat', 'The Cabbage', 'Nothing'], correctIndex: 1, explanation: 'The farmer must take the Goat first; wolf and cabbage cannot harm each other!' },
  { question: 'Three boxes are labeled "Apples", "Oranges", and "Both". Every label is WRONG. You pick 1 fruit from 1 box. Which box gives enough info to label all 3?', options: ['Apples box', 'Oranges box', 'The box labeled "Both"', 'None of them'], correctIndex: 2, explanation: 'The "Both" box must be purely one fruit. That single fruit identifies it, and the other two swap!' },
  { question: 'If two painters can paint two rooms in two hours, how many painters are needed to paint 18 rooms in 6 hours?', options: ['3', '6', '9', '12'], correctIndex: 1, explanation: 'One painter takes 2 hours per room. In 6 hours, one painter paints 3 rooms. 18 / 3 = 6 painters!' }
];

export const LogicPuzzle: React.FC<Props> = ({ difficulty, onComplete, useHint, hintsLeft }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintMsg, setHintMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRiddle();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
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
      setHintMessage(`Clue: "${currentRiddle.explanation.slice(0, 40)}..."`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6 bg-pv-surface-primary/80 p-4 rounded-xl border border-pv-border-strong shadow-sm">
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Riddle</p>
          <p className="text-xl font-bold text-pink-400">{round} / {totalRounds}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Timer</p>
          <p className="text-xl font-bold text-cyan-400">{timer}s</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-pv-text-secondary font-semibold uppercase">Score</p>
          <p className="text-xl font-bold text-emerald-400">{score}</p>
        </div>
      </div>

      {/* Question Card */}
      {currentRiddle && (
        <div className="w-full bg-pv-bg-secondary/90 border-2 border-pink-500/30 rounded-2xl p-8 mb-6 shadow-sm flex flex-col items-center relative overflow-hidden">
          <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-4">Logical Reasoning Riddle</p>
          <p className="text-xl sm:text-2xl font-bold text-white text-center leading-relaxed my-2">
            {currentRiddle.question}
          </p>

          {isAnswered && (
            <div className="mt-4 p-3 bg-pink-950/60 border border-pink-500/40 rounded-xl text-pink-200 text-sm text-center">
              💡 {currentRiddle.explanation}
            </div>
          )}

          {hintMsg && !isAnswered && (
            <div className="mt-4 bg-pink-500/20 border border-pink-500/40 text-pink-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-300" />
              {hintMsg}
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      {currentRiddle && (
        <div className="flex flex-col gap-3 w-full mb-6">
          {currentRiddle.options.map((opt, idx) => {
            let style = "bg-pv-surface-primary hover:bg-pv-surface-soft text-white border-pv-border-strong";
            if (isAnswered) {
              if (idx === currentRiddle.correctIndex) {
                style = "bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-600/30 scale-102";
              } else if (idx === selectedIndex) {
                style = "bg-rose-600 text-white border-rose-400";
              } else {
                style = "bg-pv-surface-primary/40 text-pv-text-muted border-pv-border-violet opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`p-4 rounded-xl border-2 text-lg font-bold text-left transition-all duration-200 shadow-md flex items-center justify-between ${style}`}
              >
                <span>{opt}</span>
                {isAnswered && idx === currentRiddle.correctIndex && <CheckCircle2 className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Action */}
      <button
        onClick={handleHint}
        disabled={isAnswered || hintsLeft <= 0}
        className="w-full bg-pv-dragon-fruit/20 hover:bg-pv-dragon-fruit/30 text-pv-dragon-fruit-light border border-pv-dragon-fruit/40 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
      >
        <HelpCircle className="w-4 h-4" /> Hint ({hintsLeft})
      </button>
    </div>
  );
};
