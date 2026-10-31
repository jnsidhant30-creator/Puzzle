import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

export const AdminSettings = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textMain">Platform Settings</h1>
      </div>

      <div className="bg-error/10 border border-error/20 rounded-xl p-6 flex gap-4">
        <ShieldAlert className="w-6 h-6 text-error shrink-0" />
        <div>
          <h3 className="text-error font-bold mb-1">Configuration Locked</h3>
          <p className="text-sm text-error/80">
            For security reasons, dynamic application configuration and maintenance mode toggles must be performed through secure Firebase Remote Config or Cloud Functions. They cannot be altered via this client-side dashboard in this phase.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-textMain">System Constants</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Application Name</label>
            <input
              type="text"
              readOnly
              value="PuzzleVerse"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Version</label>
            <input
              type="text"
              readOnly
              value="1.0.0 (Phase 15)"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Daily XP Bonus</label>
            <input
              type="text"
              readOnly
              value="50 XP"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Maximum Combo Multiplier</label>
            <input
              type="text"
              readOnly
              value="5.0x"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-textMain opacity-70 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <button disabled className="px-6 py-2 bg-surfaceHover text-textMuted rounded-lg text-sm font-medium cursor-not-allowed opacity-50">
            Save Configuration (Disabled)
          </button>
        </div>
      </div>
    </div>
  );
};
