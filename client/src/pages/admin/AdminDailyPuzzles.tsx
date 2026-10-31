import { useEffect, useState } from 'react';
import { getAdminDailyPuzzles, scheduleAdminDailyPuzzle, getAdminPuzzles } from '../../services/adminService';
import type { DailyPuzzleEntry } from '../../services/adminService';
import type { Puzzle } from '../../services/puzzleService';
import { Calendar as CalendarIcon, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminDailyPuzzles = () => {
  const [dailyPuzzles, setDailyPuzzles] = useState<DailyPuzzleEntry[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [date, setDate] = useState('');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState('');

  const fetchData = async () => {
    try {
      const [dpData, pData] = await Promise.all([
        getAdminDailyPuzzles(),
        getAdminPuzzles()
      ]);
      setDailyPuzzles(dpData);
      setPuzzles(pData.filter(p => p.isPublished)); // Only published puzzles can be daily puzzles
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedPuzzleId) return setError("Please select a date and a puzzle.");
    
    const pz = puzzles.find(p => p.id === selectedPuzzleId);
    if (!pz) return setError("Puzzle not found.");

    try {
      setScheduling(true);
      setError(null);
      await scheduleAdminDailyPuzzle(date, pz.id!, pz.type, pz.difficulty);
      setDate('');
      setSelectedPuzzleId('');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to schedule Daily Puzzle.");
    } finally {
      setScheduling(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Daily Puzzles</h1>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-textMain mb-4">Schedule Daily Puzzle</h2>
        <form onSubmit={handleSchedule} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 w-full md:w-auto flex-1">
            <label className="text-sm font-medium text-textMain">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          <div className="space-y-2 w-full md:w-auto flex-[2]">
            <label className="text-sm font-medium text-textMain">Puzzle</label>
            <select
              required
              value={selectedPuzzleId}
              onChange={e => setSelectedPuzzleId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="">Select a published puzzle...</option>
              {puzzles.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.type} - {p.difficulty})</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={scheduling}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryLight transition-colors font-medium text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {scheduling ? 'Scheduling...' : 'Schedule'}
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-textMuted">Loading schedule...</td>
                </tr>
              ) : dailyPuzzles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-textMuted">No scheduled Daily Puzzles.</td>
                </tr>
              ) : (
                dailyPuzzles.map((dp) => {
                  let status = 'SCHEDULED';
                  let statusClass = 'bg-surfaceHover text-textMuted';
                  
                  if (dp.date === todayStr) {
                    status = 'ACTIVE';
                    statusClass = 'bg-primary/10 text-primary';
                  } else if (dp.date < todayStr) {
                    status = 'COMPLETED';
                    statusClass = 'bg-success/10 text-success';
                  }

                  return (
                    <tr key={dp.id} className="hover:bg-surfaceHover/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="w-4 h-4 text-textMuted" />
                          <span className="text-sm font-medium text-textMain">{dp.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-surfaceHover text-textMuted">
                          {dp.puzzleType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-textMuted">
                          {dp.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 text-xs font-bold rounded-full",
                          statusClass
                        )}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
