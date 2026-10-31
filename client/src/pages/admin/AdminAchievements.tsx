import { useEffect, useState } from 'react';
import { getAdminAchievements, updateAdminAchievement } from '../../services/adminService';
import type { Achievement } from '../../services/achievementService';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAchievements = async () => {
    try {
      const data = await getAdminAchievements();
      setAchievements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const confirm = window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this achievement?`);
    if (!confirm) return;
    try {
      await updateAdminAchievement(id, { isActive: !currentStatus });
      await fetchAchievements();
    } catch (err) {
      console.error("Failed to toggle achievement:", err);
      alert("Failed to update achievement.");
    }
  };

  const filteredAchievements = achievements.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Achievements</h1>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning">
        Achievement creation is currently handled via the backend initialization script to ensure data integrity. Admins can view and toggle the active status of existing achievements.
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Icon</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Achievement</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">XP Reward</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-textMuted">Loading achievements...</td>
                </tr>
              ) : filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-textMuted">No achievements found.</td>
                </tr>
              ) : (
                filteredAchievements.map((ach) => (
                  <tr key={ach.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-10 h-10 bg-surface rounded-xl border border-border flex items-center justify-center text-xl">
                        {ach.icon}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-textMain">{ach.name}</div>
                      <div className="text-xs text-textMuted">{ach.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-textMain">{ach.requirementType}</div>
                      <div className="text-xs text-textMuted">Value: {ach.requirementValue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-primary">+{ach.xpReward} XP</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        ach.isActive ? "bg-success/10 text-success" : "bg-surfaceHover text-textMuted"
                      )}>
                        {ach.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => toggleActive(ach.id, ach.isActive)}
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-medium transition-colors",
                          ach.isActive ? "text-error hover:text-error/80" : "text-success hover:text-success/80"
                        )}
                      >
                        {ach.isActive ? (
                          <>Deactivate <ToggleRight className="w-5 h-5" /></>
                        ) : (
                          <>Activate <ToggleLeft className="w-5 h-5" /></>
                        )}
                      </button>
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
