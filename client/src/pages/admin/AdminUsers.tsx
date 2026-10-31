import { useEffect, useState } from 'react';
import { getAdminUsers } from '../../services/adminService';
import type { UserProfile } from '../../services/authService';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLAYER' | 'ADMIN'>('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers(50); // initial load
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                          u.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Players</h1>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="ALL">All Roles</option>
              <option value="PLAYER">PLAYER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">XP</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Games</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-textMuted">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-textMuted">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-textMain">{user.username}</div>
                          <div className="text-xs text-textMuted">{user.displayName || 'No display name'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surfaceHover text-xs font-bold text-textMain">
                        {user.level || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {user.xp?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {user.totalGames || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        user.role === 'ADMIN' ? "bg-accent/10 text-accent" : "bg-surfaceHover text-textMuted"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/admin/players/${user.uid}`} className="text-primary hover:text-primaryLight">
                        View
                      </Link>
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
