import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-black font-semibold hover:bg-primary-600 shadow-lg transform hover:-translate-y-0.5 transition-all',
        primary: 'bg-primary-600 text-black font-semibold hover:bg-primary-700 shadow-lg transform hover:-translate-y-0.5 transition-all',
        secondary: 'bg-secondary text-white hover:bg-secondary/80 border border-border hover:border-primary-500/40',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500/10 hover:border-primary-400',
        ghost: 'text-primary-500 hover:bg-muted hover:text-primary-600',
        destructive: 'bg-error-600 text-white font-semibold hover:bg-error-700 shadow-lg',
        link: 'text-primary-500 underline-offset-4 hover:underline font-medium',
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';