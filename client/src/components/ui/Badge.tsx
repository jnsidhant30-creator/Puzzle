import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          {
            'border-transparent bg-primary/10 text-primary': variant === 'default',
            'border-transparent bg-secondary/10 text-secondary': variant === 'secondary',
            'border-transparent bg-error/10 text-error': variant === 'error',
            'text-textMain border-border': variant === 'outline',
            'border-transparent bg-success/10 text-success': variant === 'success',
            'border-transparent bg-warning/10 text-warning': variant === 'warning',
          },
          className
        )}
        {...props}
      />
    );
  }
);
