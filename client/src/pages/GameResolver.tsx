import { useParams } from 'react-router-dom';
import { gameRegistry } from '../games/GameRegistry';
import { Suspense } from 'react';

const FallbackLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const GameResolver = () => {
  const { id } = useParams<{ id: string }>();

  if (!id || !gameRegistry[id]) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-error mb-4">Game Not Found</h1>
        <p className="text-textMuted mb-6">The game you are looking for does not exist or is unavailable.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const GameComponent = gameRegistry[id];
  return (
    <Suspense fallback={<FallbackLoader />}>
      <GameComponent />
    </Suspense>
  );
};
