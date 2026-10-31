import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { defaultPuzzles } from '../../data/puzzles';

export const InitPuzzles = () => {
  const [status, setStatus] = useState<string>('Ready to initialize puzzles...');
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    setLoading(true);
    setStatus('Initializing puzzles...');
    try {
      const puzzlesRef = collection(db, 'puzzles');
      for (const puzzle of defaultPuzzles) {
        setStatus(`Writing ${puzzle.title}...`);
        const { icon, route, ...dbData } = puzzle as any;
        await setDoc(doc(puzzlesRef, puzzle.id), {
          ...dbData,
          isPublished: true,
        });
      }
      setStatus('Successfully initialized all puzzles!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Initialize Default Puzzles</h1>
      <p className="text-gray-400">This will write the 16 default puzzles to the 'puzzles' collection in Firestore.</p>
      <button 
        onClick={handleInit}
        disabled={loading}
        className="px-6 py-2 bg-primary text-white font-bold rounded"
      >
        {loading ? 'Initializing...' : 'Initialize Puzzles'}
      </button>
      <p className="text-green-500 font-mono mt-4">{status}</p>
    </div>
  );
};
