import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Shuffle, Calendar, Trophy, Award } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    { label: 'Challenge Run', icon: Shuffle, route: '/game/challenge', primary: true },
    { label: 'Daily Puzzle', icon: Calendar, route: '/daily-puzzle' },
    { label: 'Leaderboard', icon: Trophy, route: '/leaderboard' },
    { label: 'Achievements', icon: Award, route: '/achievements' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <Link key={i} to={action.route} className="block">
          <Button 
            variant={action.primary ? 'primary' : 'secondary'} 
            className={`w-full h-full min-h-[4rem] flex flex-col items-center justify-center gap-1.5 py-3 ${
              action.primary ? 'shadow-md shadow-primary/20' : 'bg-surface hover:bg-background'
            }`}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
};
