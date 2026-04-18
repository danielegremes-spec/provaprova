import { cn } from '../../lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md': variant === 'primary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'default',
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-5 text-base': size === 'md',
          'h-14 px-8 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
