interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatsCard = ({ label, value, icon, highlight }: StatsCardProps) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${highlight ? 'bg-primary/5 border-primary/30 shadow-sm shadow-primary/5' : 'bg-surface border-border shadow-sm'} flex flex-col justify-center`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${highlight ? 'bg-primary/10' : 'bg-background'}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-3xl font-extrabold tracking-tight ${highlight ? 'text-primary' : 'text-textMain'}`}>
        {value}
      </span>
    </div>
  );
};
