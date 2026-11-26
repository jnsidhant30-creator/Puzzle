import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchPuzzleGuides } from '../services/firebase';
import { PuzzleGuide } from '../types';
import {
  BookOpen,
  Search,
  Play,
  Compass,
  CheckCircle2,
  Lightbulb,
  Gamepad2,
  AlertTriangle,
  ChevronRight,
  X,
  Binary,
  Type,
  Brain,
  Grid3X3,
  Shapes,
  GitMerge,
  Workflow,
  MoveRight,
  Footprints,
  RotateCw,
  FileText,
  Navigation,
  Zap,
  Flame,
} from 'lucide-react';
import { PageHeader, Card } from '../components/ui/Card';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Binary,
  Type,
  Brain,
  Grid3X3,
  Lightbulb,
  Shapes,
  GitMerge,
  Workflow,
  MoveRight,
  Footprints,
  RotateCw,
  FileText,
  Compass,
  Navigation,
  Zap,
  Flame,
};

export const LearnPage: React.FC = () => {
  const { selectedLearnPuzzleType, playGame, setActiveTab } = useStore();
  const [guides, setGuides] = useState<PuzzleGuide[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeGuide, setActiveGuide] = useState<PuzzleGuide | null>(null);
  const [guideTab, setGuideTab] = useState<'rules' | 'strategy' | 'tips'>('rules');

  useEffect(() => {
    fetchPuzzleGuides().then((res) => {
      setGuides(res);
      if (selectedLearnPuzzleType) {
        const match = res.find((g) => g.puzzleType === selectedLearnPuzzleType);
        if (match) setActiveGuide(match);
      }
    });
  }, [selectedLearnPuzzleType]);

  const categories = ['All', 'Math', 'Words', 'Memory', 'Logic', 'Spatial & Grid', 'Challenge'];

  const filteredGuides = guides.filter((g) => {
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.rules.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.basicStrategy.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (iconName: string) => {
    const Comp = ICON_MAP[iconName] || BookOpen;
    return <Comp className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Guides & Rulebooks"
        description="Core mechanics, controls, solving strategies, and pro tips for all 16 puzzle modes."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pv-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, modes..."
            className="w-full bg-pv-surface-primary border border-pv-border rounded-lg pl-9 pr-3 h-8 text-xs text-pv-text-primary placeholder-pv-text-muted focus:outline-none focus:border-pv-dragon-fruit"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 border-b sm:border-0 border-pv-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 h-7 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-pv-surface-soft text-pv-text-primary border border-pv-border-strong'
                  : 'text-pv-text-secondary hover:text-pv-text-primary hover:bg-pv-surface-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuides.map((guide) => (
          <Card
            key={guide.puzzleType}
            onClick={() => {
              setActiveGuide(guide);
              setGuideTab('rules');
            }}
            className="p-5 hover:border-pv-border-strong transition-colors cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-pv-surface-secondary border border-pv-border flex items-center justify-center text-pv-dragon-fruit">
                  {renderIcon(guide.iconName)}
                </div>
                <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-pv-surface-secondary border border-pv-border text-pv-text-muted">
                  {guide.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-pv-text-primary">{guide.title}</h3>
              <p className="text-xs text-pv-text-secondary line-clamp-3 leading-relaxed">
                {guide.overview}
              </p>
            </div>

            <div className="pt-3 border-t border-pv-border flex items-center justify-between text-xs text-pv-dragon-fruit font-medium">
              <span>View Guide & Rules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-pv-surface-primary border border-pv-border rounded-xl p-6 max-w-2xl w-full space-y-5 shadow-lg relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-pv-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pv-surface-secondary border border-pv-border flex items-center justify-center text-pv-dragon-fruit shrink-0">
                  {renderIcon(activeGuide.iconName)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-pv-text-muted">
                    {activeGuide.category}
                  </span>
                  <h2 className="text-base font-semibold text-pv-text-primary">{activeGuide.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setActiveGuide(null)}
                className="p-1 rounded-md text-pv-text-muted hover:text-pv-text-primary hover:bg-pv-surface-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Objective */}
            <div className="bg-pv-surface-secondary rounded-lg p-3 border border-pv-border">
              <span className="text-[10px] font-semibold text-pv-text-muted uppercase tracking-wider block mb-1">
                Objective
              </span>
              <p className="text-xs text-pv-text-primary leading-relaxed">{activeGuide.objective}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-pv-border gap-2">
              {[
                { id: 'rules', label: 'Rules & Controls' },
                { id: 'strategy', label: 'Solving Strategies' },
                { id: 'tips', label: 'Common Pitfalls & Tips' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGuideTab(tab.id as any)}
                  className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
                    guideTab === tab.id
                      ? 'border-pv-dragon-fruit text-pv-text-primary'
                      : 'border-transparent text-pv-text-secondary hover:text-pv-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Rules */}
            {guideTab === 'rules' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Core Game Rules
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.rules.map((rule, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Controls & Inputs
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.controls.map((ctrl, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {ctrl}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Strategy */}
            {guideTab === 'strategy' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Fundamental Strategies
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.basicStrategy.map((strat, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {strat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-pv-dragon-fruit" /> Advanced Solving Tactics
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.advancedStrategy.map((strat, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {strat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Tips */}
            {guideTab === 'tips' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Common Mistakes
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-pv-text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Pro Tips
                  </h4>
                  <ul className="space-y-1.5 text-pv-text-secondary">
                    {activeGuide.proTips.map((tip, idx) => (
                      <li key={idx} className="bg-pv-surface-secondary p-2.5 rounded-lg border border-pv-border">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-pv-border flex items-center gap-2.5">
              <button
                onClick={() => {
                  const puzzleType = activeGuide.puzzleType;
                  setActiveGuide(null);
                  playGame(puzzleType);
                }}
                className="flex-1 h-9 bg-pv-dragon-fruit hover:bg-pv-dragon-fruit-hover text-[#110F15] font-semibold font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Mode
              </button>
              <button
                onClick={() => {
                  setActiveGuide(null);
                  setActiveTab('journey');
                }}
                className="h-9 px-4 bg-pv-surface-secondary hover:bg-pv-surface-soft text-pv-text-primary border border-pv-border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" /> Practice in Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
