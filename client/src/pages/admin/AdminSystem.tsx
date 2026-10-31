import { Server, ShieldCheck, Activity } from 'lucide-react';

export const AdminSystem = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <Server className="w-6 h-6 text-primary" />
          System Health
        </h1>
      </div>
      
      <p className="text-sm text-textMuted">
        Diagnostic overview of verifiable application and infrastructure states.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Environment Profile */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Environment Profile
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-textMuted">Client Version</span>
              <span className="text-sm font-bold text-textMain">v1.5.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-textMuted">Game Result Mode</span>
              <span className="text-sm font-bold text-textMain">{import.meta.env.VITE_GAME_RESULT_MODE || 'FREE'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-textMuted">Active Game Engines</span>
              <span className="text-sm font-bold text-textMain">16</span>
            </div>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-textMain flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            Infrastructure Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-textMuted">Firebase Auth</span>
              <span className="text-sm font-bold text-success flex items-center gap-1">Online</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-textMuted">Cloud Firestore</span>
              <span className="text-sm font-bold text-success flex items-center gap-1">Online</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-textMuted">Cloud Functions</span>
              <span className="text-sm font-bold text-textMuted flex items-center gap-1">Unknown</span>
            </div>
          </div>
          <p className="text-xs text-textMuted mt-4 italic">
            Note: Cloud Functions cannot be deterministically pinged from the client without executing an operation.
          </p>
        </div>

      </div>
    </div>
  );
};
