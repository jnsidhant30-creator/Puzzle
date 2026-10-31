import { useState } from 'react';
import { archiveAdminPuzzle, updateAdminPuzzle } from '../../services/adminService';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { Link } from 'react-router-dom';
import { Search, Plus, Archive, Play } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminPuzzles = () => {
  const { puzzles, isLoading } = usePuzzleStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const handleArchive = async (id: string, isPublished: boolean) => {
    if (!isPublished) return; // Already archived/unpublished
    const confirm = window.confirm("Are you sure you want to archive this puzzle? It will no longer be available to players.");
    if (!confirm) return;
    try {
      await archiveAdminPuzzle(id);
    } catch (err) {
      console.error("Failed to archive:", err);
      alert("Failed to archive puzzle.");
    }
  };

  const filteredPuzzles = puzzles.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.category === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-textMain">Puzzles</h1>
        {/* We don't want them creating new puzzles arbitrarily right now since we are managing procedural ones */}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="QUICK THINKING">QUICK THINKING</option>
              <option value="MEMORY">MEMORY</option>
              <option value="LOGIC">LOGIC</option>
              <option value="PATH & MAZE">PATH & MAZE</option>
              <option value="SPATIAL">SPATIAL</option>
              <option value="WORD">WORD</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-textMuted">Loading puzzles...</td>
                </tr>
              ) : filteredPuzzles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">No puzzles found.</td>
                </tr>
              ) : (
                filteredPuzzles.map((puzzle: any) => (
                  <tr key={puzzle.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-textMain">{puzzle.title}</div>
                      <div className="text-xs text-textMuted truncate max-w-[200px]">{puzzle.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-surfaceHover text-textMuted">
                        {puzzle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        puzzle.difficulty === 'Easy' ? "bg-success/10 text-success" :
                        puzzle.difficulty === 'Medium' ? "bg-warning/10 text-warning" :
                        puzzle.difficulty === 'Hard' ? "bg-error/10 text-error" :
                        "bg-primary/10 text-primary"
                      )}>
                        {puzzle.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        puzzle.isPublished !== false ? "bg-success/10 text-success" : "bg-surfaceHover text-textMuted"
                      )}>
                        {puzzle.isPublished !== false ? "PUBLISHED" : "ARCHIVED / DRAFT"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/admin/puzzles/${puzzle.id}`} className="text-primary hover:text-primaryLight transition-colors">
                          Edit
                        </Link>
                        {puzzle.isPublished !== false && (
                          <button 
                            onClick={() => handleArchive(puzzle.id, puzzle.isPublished !== false)}
                            className="text-error hover:text-error/80 transition-colors"
                            title="Archive Puzzle"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
