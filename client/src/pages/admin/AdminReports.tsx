import { useEffect, useState } from 'react';
import { getAdminReports } from '../../services/adminService';
import type { Report } from '../../services/adminService';
import { getPlayerActivityReportCSV, getGamePerformanceReportCSV } from '../../services/adminAnalyticsService';
import type { TimeRange } from '../../services/adminAnalyticsService';
import { usePuzzleStore } from '../../store/usePuzzleStore';
import { FileText, Download, Activity, Gamepad2, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { activePuzzles } = usePuzzleStore();
  
  const [exportRange, setExportRange] = useState<TimeRange>('30days');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getAdminReports();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadCSV = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPlayerActivity = async () => {
    setIsExporting(true);
    try {
      const csv = await getPlayerActivityReportCSV(exportRange);
      downloadCSV(`Player_Activity_Report_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`, csv);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGamePerformance = async () => {
    if (activePuzzles.length === 0) {
      alert("No active puzzles loaded.");
      return;
    }
    setIsExporting(true);
    try {
      const activeTypes = activePuzzles.map(p => p.title);
      const csv = await getGamePerformanceReportCSV(exportRange, activeTypes);
      downloadCSV(`Game_Performance_Report_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`, csv);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Reports Hub
        </h1>
      </div>
      
      {/* Report Generation Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-textMain">Generate Data Reports</h2>
            <p className="text-sm text-textMuted">Export analytical data as CSV for external review.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-textMuted">Date Range:</span>
            <select
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value as TimeRange)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-textMain focus:outline-none focus-visible:border-primary"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleExportPlayerActivity}
            disabled={isExporting}
            className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-textMain">Player Activity Report</div>
                <div className="text-xs text-textMuted">XP, Games, Streaks, Retention</div>
              </div>
            </div>
            <Download className="w-5 h-5 text-textMuted group-hover:text-primary transition-colors" />
          </button>

          <button 
            onClick={handleExportGamePerformance}
            disabled={isExporting || activePuzzles.length === 0}
            className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-secondary transition-colors disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-secondary/10 text-secondary rounded-lg group-hover:bg-secondary group-hover:text-white transition-colors">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-textMain">Game Performance Report</div>
                <div className="text-xs text-textMuted">Attempts, Completions, Win Rates</div>
              </div>
            </div>
            <Download className="w-5 h-5 text-textMuted group-hover:text-secondary transition-colors" />
          </button>
        </div>
      </section>

      {/* Moderation / Content Reports */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-error" />
            Flagged Content & Moderation
          </h2>
          <p className="text-sm text-textMuted">Review platform violations and user-submitted reports.</p>
        </div>

        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surfaceHover">
                  <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Target ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-textMuted">Loading flagged content...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-textMuted">No content currently flagged.</td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-surfaceHover/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textMain">
                        {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-surfaceHover text-textMuted">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted font-mono">
                        {report.targetId}
                      </td>
                      <td className="px-6 py-4 text-sm text-textMuted max-w-xs truncate">
                        {report.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 text-xs font-bold rounded-full",
                          report.status === 'PENDING' ? "bg-warning/10 text-warning" :
                          report.status === 'RESOLVED' ? "bg-success/10 text-success" :
                          "bg-textMuted/10 text-textMuted"
                        )}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
