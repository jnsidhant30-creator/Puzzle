import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pv-dragon-fruit disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-gradient-primary-btn text-pv-bg-primary hover:opacity-90 shadow-sm border border-pv-dragon-fruit/50',
      secondary: 'bg-pv-surface-primary border border-pv-border-strong text-pv-text-secondary hover:text-white hover:bg-pv-surface-soft',
      ghost: 'bg-transparent text-pv-text-secondary hover:text-white hover:bg-white/5',
      danger: 'bg-transparent text-pv-text-secondary hover:text-rose-400 hover:bg-rose-500/10'
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
