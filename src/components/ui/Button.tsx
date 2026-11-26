import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
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
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4696] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110F15] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'min-h-[44px] sm:min-h-0 h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-sm font-semibold',
      icon: 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-10 w-10 p-0',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#FF4696] text-[#110F15] font-semibold hover:bg-[#E83C86] border border-transparent',
      secondary:
        'bg-[#24202C] text-[#F5F3F7] hover:bg-[#2B2533] border border-[#342D3D] hover:border-[#494052]',
      outline:
        'bg-transparent text-[#F5F3F7] border border-[#494052] hover:bg-[#24202C] hover:border-[#9F97AB]',
      ghost:
        'bg-transparent text-[#B9B3C2] hover:text-[#F5F3F7] hover:bg-[#24202C] border border-transparent',
      destructive:
        'bg-[#F87171]/10 text-[#F87171] hover:bg-[#F87171]/20 border border-[#F87171]/30',
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
