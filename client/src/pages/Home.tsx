import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const Home = () => {
  return (
    <div className="space-y-10">
      <section className="text-center py-20 px-4 glass rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Challenge Your Mind.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Beat Your Best.</span>
        </h1>
        <p className="text-xl text-textMuted mb-10 max-w-2xl mx-auto">
          Welcome to PuzzleVerse, the ultimate premium platform for testing your logic, memory, and speed across endless challenges.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = '/play'}>PLAY NOW</Button>
          <Button variant="secondary" size="lg">DAILY PUZZLE</Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary text-2xl">🏆</div>
            <h3 className="text-xl font-bold">Global Leaderboards</h3>
            <p className="text-textMuted">Compete against thousands of players worldwide and climb the ranks.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto text-secondary text-2xl">🧠</div>
            <h3 className="text-xl font-bold">6 Puzzle Modes</h3>
            <p className="text-textMuted">From logic and numbers to memory and sliding puzzles. Test all skills.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent text-2xl">✨</div>
            <h3 className="text-xl font-bold">Earn XP & Level Up</h3>
            <p className="text-textMuted">Unlock achievements, maintain your daily streak, and build your profile.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
