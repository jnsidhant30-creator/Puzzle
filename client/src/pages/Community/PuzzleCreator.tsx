import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publishCommunityPuzzle } from '../../services/communityService';
import type { PuzzleType, Difficulty } from '../../games/core/types';
import { useAuthStore } from '../../store/useAuthStore';

export const PuzzleCreator: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gameType, setGameType] = useState<PuzzleType>('NUMBER');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to create a puzzle.");
    
    setIsPublishing(true);
    
    try {
      const puzzleSeed = Math.floor(Math.random() * 1000000000); // Generate deterministic seed
      
      const res = await publishCommunityPuzzle({
        title,
        description,
        instructions,
        gameType,
        difficulty,
        config: { puzzleSeed },
        status: 'published' // Publish immediately for simplicity
      });
      
      if (res.data.success) {
        navigate(`/community/${res.data.puzzleId}`);
      }
    } catch (err: any) {
      alert("Error publishing puzzle: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const puzzleTypes: PuzzleType[] = [
    'NUMBER', 'WORD', 'MEMORY', 'SLIDING', 'LOGIC', 'PATTERN',
    'PIPE', 'COLOR_PATH', 'MAZE_ESCAPE', 'LASER_MIRROR', 'ARROW_PATH',
    'BLOCK_ESCAPE', 'NUMBER_PATH', 'ROTATING_TILES', 'WORD_GRID', 'CHALLENGE'
  ];

  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button 
        onClick={() => navigate('/community')}
        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mb-6 flex items-center transition-colors"
      >
        ← Back to Community Puzzles
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Community Puzzle</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Puzzle Title</label>
            <input 
              type="text" 
              required
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="E.g., The Ultimate Logic Challenge"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea 
              required
              maxLength={200}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe your puzzle to the community..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Game Type</label>
            <select 
              value={gameType}
              onChange={(e) => setGameType(e.target.value as PuzzleType)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {puzzleTypes.map(pt => (
                <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {difficulties.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Instructions (Optional)</label>
            <textarea 
              rows={2}
              maxLength={200}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="Any specific rules or hints for players?"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="submit"
              disabled={isPublishing}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow"
            >
              {isPublishing ? 'Publishing...' : 'Publish to Community'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              By publishing, you agree to the community guidelines. Malicious or inappropriate content will be removed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
