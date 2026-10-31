import React, { useEffect, useState } from 'react';
import type { BattleData } from '../../../../functions/src/types';
import { BattleContext } from './BattleContext';
import { useAuthStore } from '../../store/useAuthStore';
import { syncBattleProgress } from '../../services/battleService';
import { useNavigate } from 'react-router-dom';

// Import all games lazily to avoid circular dependencies
const NumberPuzzle = React.lazy(() => import('../../games/number/NumberPuzzle').then(m => ({ default: m.NumberPuzzle })));
const WordPuzzle = React.lazy(() => import('../../games/word/WordPuzzle').then(m => ({ default: m.WordPuzzle })));
const MemoryPuzzle = React.lazy(() => import('../../games/memory/MemoryPuzzle').then(m => ({ default: m.MemoryPuzzle })));
const SlidingPuzzle = React.lazy(() => import('../../games/sliding/SlidingPuzzle').then(m => ({ default: m.SlidingPuzzle })));
const LogicPuzzle = React.lazy(() => import('../../games/logic/LogicPuzzle').then(m => ({ default: m.LogicPuzzle })));
const PatternPuzzle = React.lazy(() => import('../../games/pattern/PatternPuzzle').then(m => ({ default: m.PatternPuzzle })));
const PipeGame = React.lazy(() => import('../../games/pipe/PipeGame').then(m => ({ default: m.PipeGame })));
const ColorPathGame = React.lazy(() => import('../../games/color/ColorPathGame').then(m => ({ default: m.ColorPathGame })));
const BlockEscapeGame = React.lazy(() => import('../../games/block/BlockEscapeGame').then(m => ({ default: m.BlockEscapeGame })));
const NumberPathGame = React.lazy(() => import('../../games/numberPath/NumberPathGame').then(m => ({ default: m.NumberPathGame })));
const RotatingTilesGame = React.lazy(() => import('../../games/rotate/RotatingTilesGame').then(m => ({ default: m.RotatingTilesGame })));
const WordGridGame = React.lazy(() => import('../../games/wordGrid/WordGridGame').then(m => ({ default: m.WordGridGame })));
const ChallengeGame = React.lazy(() => import('../../games/challenge/ChallengeGame').then(m => ({ default: m.ChallengeGame })));
const ArrowPathGame = React.lazy(() => import('../../games/arrow/ArrowPathGame').then(m => ({ default: m.ArrowPathGame })));
const MazeEscapeGame = React.lazy(() => import('../../games/maze/MazeEscapeGame').then(m => ({ default: m.MazeEscapeGame })));
const LaserMirrorGame = React.lazy(() => import('../../games/laser/LaserMirrorGame').then(m => ({ default: m.LaserMirrorGame })));

export const LiveBattle = ({ battle }: { battle: BattleData }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // If completed, we shouldn't be here, BattleResolver handles it
  useEffect(() => {
    if (battle.status === 'completed') {
      // no-op
    }
  }, [battle.status]);

  const isPlayerA = battle.playerA.uid === user?.uid;
  const meKey = isPlayerA ? 'playerA' : 'playerB';
  const oppKey = isPlayerA ? 'playerB' : 'playerA';

  const me = battle[meKey]!;
  const opp = battle[oppKey]!;

  const renderGame = () => {
    switch (battle.gameType) {
      case 'NUMBER': return <NumberPuzzle />;
      case 'WORD': return <WordPuzzle />;
      case 'MEMORY': return <MemoryPuzzle />;
      case 'SLIDING': return <SlidingPuzzle />;
      case 'LOGIC': return <LogicPuzzle />;
      case 'PATTERN': return <PatternPuzzle />;
      case 'PIPE': return <PipeGame />;
      case 'COLOR_PATH': return <ColorPathGame />;
      case 'BLOCK_ESCAPE': return <BlockEscapeGame />;
      case 'NUMBER_PATH': return <NumberPathGame />;
      case 'ROTATING_TILES': return <RotatingTilesGame />;
      case 'WORD_GRID': return <WordGridGame />;
      case 'CHALLENGE': return <ChallengeGame />;
      case 'ARROW_PATH': return <ArrowPathGame />;
      case 'MAZE_ESCAPE': return <MazeEscapeGame />;
      case 'LASER_MIRROR': return <LaserMirrorGame />;
      default: return <div>Game not found</div>;
    }
  };

  return (
    <BattleContext.Provider value={{ battle }}>
      <div className="relative w-full h-full flex flex-col pt-16"> {/* Add top padding for the fixed overlay */}
        
        {/* Battle HUD Overlay */}
        <div className="fixed top-0 left-0 w-full h-16 bg-surface-elevated/90 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4 lg:px-8 shadow-lg">
          
          {/* Me */}
          <div className="flex items-center gap-4 w-1/3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full border-2 border-success flex items-center justify-center overflow-hidden`}>
                {me.avatarUrl ? <img src={me.avatarUrl} alt="Me" /> : <span className="font-bold">{me.displayName.charAt(0).toUpperCase()}</span>}
              </div>
              {me.completedAt && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-surface" />
              )}
            </div>
            <div className="flex-1 hidden sm:block">
              <p className="text-sm font-bold text-textMain truncate">{me.displayName} (You)</p>
              <div className="w-full h-1.5 bg-surface rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-success transition-all duration-300" style={{ width: `${me.progress}%` }} />
              </div>
            </div>
            <div className="font-mono font-black text-xl text-success w-12 text-right">
              {me.score}
            </div>
          </div>

          {/* VS */}
          <div className="w-1/3 text-center flex flex-col items-center">
            <span className="text-xl font-black italic tracking-widest text-primary drop-shadow-[0_0_10px_rgba(var(--color-primary),0.5)]">VS</span>
            <span className="text-[10px] uppercase font-bold text-textMuted tracking-widest">{battle.gameType}</span>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-4 w-1/3 justify-end">
            <div className="font-mono font-black text-xl text-error w-12 text-left">
              {opp.score}
            </div>
            <div className="flex-1 hidden sm:block text-right">
              <p className="text-sm font-bold text-textMain truncate">{opp.displayName}</p>
              <div className="w-full h-1.5 bg-surface rounded-full mt-1 overflow-hidden flex justify-end">
                <div className="h-full bg-error transition-all duration-300" style={{ width: `${opp.progress}%` }} />
              </div>
            </div>
            <div className="relative">
              <div className={`w-10 h-10 rounded-full border-2 border-error flex items-center justify-center overflow-hidden`}>
                {opp.avatarUrl ? <img src={opp.avatarUrl} alt="Opp" /> : <span className="font-bold">{opp.displayName.charAt(0).toUpperCase()}</span>}
              </div>
              {opp.completedAt && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-surface" />
              )}
            </div>
          </div>

        </div>

        {/* Game Container */}
        <div className="flex-1 relative z-10 isolate">
          {renderGame()}
        </div>

        {/* Finished waiting overlay */}
        {me.completedAt && battle.status === 'active' && (
          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
            <h2 className="text-4xl font-black text-success mb-2 drop-shadow-md">FINISHED!</h2>
            <p className="text-textMuted text-lg mb-8">Waiting for {opp.displayName} to complete...</p>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

      </div>
    </BattleContext.Provider>
  );
};
