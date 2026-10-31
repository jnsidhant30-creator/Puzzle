import { useEffect, useState } from 'react';
import { getAdminAuditLogs } from '../../services/adminService';
import type { AuditLog } from '../../services/adminService';
import { ShieldAlert } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAdminAuditLogs(100);
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          Audit Logs
        </h1>
      </div>
      
      <p className="text-sm text-textMuted">
        This is a securely generated read-only ledger of sensitive administrative actions.
      </p>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHover">
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Admin UID</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Target ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Metadata Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-textMuted">No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMain font-mono">
                      {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted font-mono">
                      {log.adminUid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted font-mono">
                      {log.target}
                    </td>
                    <td className="px-6 py-4 text-sm text-textMuted max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
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
