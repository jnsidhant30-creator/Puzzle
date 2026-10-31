import { useEffect, useState } from 'react';
import { getAdminWeeklyChallenges, scheduleAdminWeeklyChallenge, type WeeklyChallengeEntry } from '../../services/adminService';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { Plus, Calendar, AlertTriangle } from 'lucide-react';
import { getISOWeek, getYear } from 'date-fns';

export const AdminWeeklyChallenges = () => {
  const [challenges, setChallenges] = useState<WeeklyChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { activePuzzles } = usePuzzleStore();
  
  const [formData, setFormData] = useState({
    year: getYear(new Date()),
    week: getISOWeek(new Date()) + 1, // Default to next week
    puzzleType: '',
    startDate: '',
    endDate: ''
  });
  
  const fetchChallenges = async () => {
    try {
      const data = await getAdminWeeklyChallenges();
      setChallenges(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weekly challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.puzzleType || !formData.startDate || !formData.endDate) {
      alert("Please fill in all fields.");
      return;
    }
    
    try {
      setError(null);
      await scheduleAdminWeeklyChallenge(
        Number(formData.year),
        Number(formData.week),
        formData.puzzleType,
        new Date(formData.startDate),
        new Date(formData.endDate)
      );
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        week: prev.week + 1,
        puzzleType: '',
        startDate: '',
        endDate: ''
      }));
      
      await fetchChallenges();
    } catch (err: any) {
      setError(err.message || "Failed to schedule weekly challenge.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-textMain">Weekly Challenges</h1>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Schedule Form */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Schedule New Challenge
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-textMuted">Year</label>
            <input 
              type="number" 
              name="year" 
              value={formData.year} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-textMuted">Week Number</label>
            <input 
              type="number" 
              name="week" 
              value={formData.week} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-textMuted">Puzzle Type</label>
            <select 
              name="puzzleType" 
              value={formData.puzzleType} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="">Select puzzle...</option>
              {activePuzzles.map(p => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-textMuted">Start Date</label>
            <input 
              type="date" 
              name="startDate" 
              value={formData.startDate} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-textMuted">End Date</label>
            <input 
              type="date" 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primaryLight transition-colors">
            Schedule Challenge
          </button>
        </div>
      </form>
      
      {/* Existing Challenges List */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" /> Scheduled Challenges
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Year/Week</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Puzzle</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Date Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-textMuted">Loading...</td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-textMuted">No weekly challenges scheduled yet.</td>
                </tr>
              ) : (
                challenges.map(c => {
                  const s = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
                  const e = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate);
                  
                  return (
                    <tr key={c.id} className="hover:bg-surfaceHover/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-textMain">Y{c.year} W{c.week}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-textMain">{c.puzzleType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-textMuted">
                          {s.toLocaleDateString()} - {e.toLocaleDateString()}
                        </div>
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
