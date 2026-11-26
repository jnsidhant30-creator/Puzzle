import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: 'primary' | 'secondary' | 'elevated' | 'featured' | 'matte';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  surface = 'primary',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const surfaces = {
    primary: 'bg-[#1C1823]',
    secondary: 'bg-[#24202C]',
    elevated: 'bg-[#2B2533]',
    featured: 'pv-stage-surface',
    matte: 'pv-board-matte',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`${surfaces[surface]} border border-[#342D3D] rounded-xl ${
        interactive ? 'hover:border-[#494052] transition-colors duration-150' : ''
      } ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#342D3D] ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#F5F3F7] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#B9B3C2] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variants = {
    neutral: 'bg-[#24202C] text-[#B9B3C2] border-[#342D3D]',
    accent: 'bg-[#FF4696]/12 text-[#FF82B8] border-[#FF4696]/30',
    success: 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/30',
    warning: 'bg-[#FBBF24]/12 text-[#FBBF24] border-[#FBBF24]/30',
    error: 'bg-[#F87171]/12 text-[#F87171] border-[#F87171]/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
