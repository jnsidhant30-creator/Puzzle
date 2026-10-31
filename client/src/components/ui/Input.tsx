import React, { useId } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-textMain">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex w-full rounded-xl border border-border bg-surface px-4 py-2.5 min-h-[44px] text-sm transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-textMuted",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:border-error focus-visible:ring-error/50",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-error font-medium" aria-live="polite">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
