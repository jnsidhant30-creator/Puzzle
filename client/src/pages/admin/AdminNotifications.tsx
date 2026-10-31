import { useEffect, useState } from 'react';
import { getAdminAnnouncements, createAdminAnnouncement, updateAdminAnnouncement } from '../../services/adminService';
import type { Announcement } from '../../services/adminService';
import { Bell, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminNotifications = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'ACTIVE' | 'NEW'>('ALL');
  const [expirationDays, setExpirationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!title || !message) {
      setError('Title and message are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      await createAdminAnnouncement({
        title,
        message,
        category,
        targetAudience,
        publishTime: new Date(),
        expirationTime: expirationDate,
        isActive: true
      });

      setShowForm(false);
      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateAdminAnnouncement(id, { isActive: !currentStatus });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Platform Announcements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primaryLight transition-colors"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> New Announcement</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-textMain mb-4">Create Announcement</h2>
          
          {error && <div className="p-3 bg-error/10 border border-error/20 text-error rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
                placeholder="e.g., Scheduled Maintenance"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
              >
                <option value="SYSTEM">System</option>
                <option value="UPDATE">Update</option>
                <option value="EVENT">Event</option>
                <option value="PROMO">Promo</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary h-24 resize-none"
              placeholder="Announcement content..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Target Audience</label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
              >
                <option value="ALL">All Players</option>
                <option value="ACTIVE">Active Players Only</option>
                <option value="NEW">New Players Only</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Expiration (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={expirationDays}
                onChange={e => setExpirationDays(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primaryLight transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Announcement</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">Loading announcements...</td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted flex flex-col items-center">
                    <Bell className="w-8 h-8 text-textMuted/30 mb-2" />
                    No announcements published yet.
                  </td>
                </tr>
              ) : (
                announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-textMain">{ann.title}</div>
                      <div className="text-xs text-textMuted line-clamp-1 mt-1 max-w-md">{ann.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {ann.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {ann.targetAudience}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleStatus(ann.id, ann.isActive)}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors",
                          ann.isActive ? "bg-success/10 text-success hover:bg-success/20" : "bg-textMuted/10 text-textMuted hover:bg-textMuted/20"
                        )}
                      >
                        {ann.isActive ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
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
