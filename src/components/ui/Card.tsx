import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: 'primary' | 'secondary' | 'elevated' | 'featured' | 'matte' | 'ivory' | 'mist';
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
    primary: 'bg-[#233D4A] border-[#36515F] text-[#F5F7F8]',
    secondary: 'bg-[#1C2D3B] border-[#36515F] text-[#F5F7F8]',
    elevated: 'bg-[#2C4654] border-[#4A6A7B] text-[#F5F7F8]',
    featured: 'pv-stage-surface border-[#4A6A7B] text-[#F5F7F8]',
    matte: 'pv-board-matte border-[#36515F] text-[#F5F7F8]',
    ivory: 'bg-[#F5F2E9] border-[#D5DEDB] text-[#142331]',
    mist: 'bg-[#E9EEE8] border-[#D5DEDB] text-[#142331]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`border rounded-xl ${surfaces[surface]} ${
        interactive ? 'hover:border-[#38C6BA]/70 transition-colors duration-150' : ''
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
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#36515F] ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#F5F7F8] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#B4C3CE] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

interface BadgeProps {
  variant?: 'neutral' | 'neutralLight' | 'accent' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variants = {
    neutral: 'bg-[#1C2D3B] text-[#B4C3CE] border-[#36515F]',
    neutralLight: 'bg-[#E9EEE8] text-[#142331] border-[#C5D2CE]',
    accent: 'bg-[#38C6BA]/15 text-[#A8E5D5] border-[#38C6BA]/40',
    success: 'bg-[#10B981]/15 text-[#6EE7B7] border-[#10B981]/35',
    warning: 'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/35',
    error: 'bg-[#EF4444]/15 text-[#FCA5A5] border-[#EF4444]/35',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[12px] font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
