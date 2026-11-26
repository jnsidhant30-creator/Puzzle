import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'secondaryLight'
  | 'outline'
  | 'outlineLight'
  | 'ghost'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38C6BA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#142331] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer pv-keycap';

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'min-h-[36px] h-9 px-3.5 text-xs',
      md: 'min-h-[44px] sm:min-h-0 h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-sm',
      icon: 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-10 w-10 p-0',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#087F8C] text-[#FFFFFF] hover:bg-[#066B75] border border-transparent',
      accent:
        'bg-[#38C6BA] text-[#142331] hover:bg-[#2EB5AA] border border-transparent',
      secondary:
        'bg-[#2C4654] text-[#F5F7F8] hover:bg-[#355464] border border-[#36515F]',
      secondaryLight:
        'bg-[#E9EEE8] text-[#142331] hover:bg-[#DCE4DF] border border-[#C3D0CB]',
      outline:
        'bg-transparent text-[#F5F7F8] border border-[#93D1F2]/65 hover:bg-[#2C4654] hover:border-[#38C6BA]',
      outlineLight:
        'bg-white/70 text-[#142331] border border-[#B4C3CE] hover:bg-[#E9EEE8]',
      ghost:
        'bg-transparent text-[#B4C3CE] hover:text-[#F5F7F8] hover:bg-[#233D4A] border border-transparent !border-b-0',
      destructive:
        'bg-[#EF4444]/15 text-[#FCA5A5] hover:bg-[#EF4444]/25 border border-[#EF4444]/35',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
