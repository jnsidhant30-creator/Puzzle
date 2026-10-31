import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          {
            'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md': variant === 'primary',
            'bg-surface-elevated border border-border hover:border-border-hover hover:bg-surface text-textMain shadow-sm': variant === 'secondary',
            'hover:bg-textMuted/10 text-textMuted hover:text-textMain': variant === 'ghost',
            'bg-error text-white hover:bg-red-700 shadow-sm hover:shadow-md': variant === 'danger',
            'h-11 sm:h-9 px-4 text-sm': size === 'sm',
            'h-12 sm:h-11 px-6 text-base': size === 'md',
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
