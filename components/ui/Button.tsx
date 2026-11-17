import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', children, className, ...props }: ButtonProps) {
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-surface hover:bg-surface-2',
    outline: 'border-2 border-border text-text hover:bg-surface-2',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center rounded font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        props.disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}
