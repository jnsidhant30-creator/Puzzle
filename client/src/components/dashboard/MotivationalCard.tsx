import { Sparkles } from 'lucide-react';

export const MotivationalCard = () => {
  return (
    <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-colors pointer-events-none" />
      <Sparkles className="w-8 h-8 text-primary mb-3" />
      <p className="text-sm font-medium text-textMain/90 leading-relaxed">
        "Small steps make big progress!"
      </p>
    </div>
  );
};
