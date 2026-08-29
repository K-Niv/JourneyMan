/**
 * client/src/components/ui/button.jsx
 * =====================================
 * Poeltl-inspired Button component with primary (#DAAE4F), secondary (#FFFFFF / #DAAE4F border),
 * outline, ghost, and destructive variants with 2px border radius.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[2px] text-sm font-bold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAAE4F] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024]/20 hover:bg-[#cda245] active:translate-y-[1px] shadow-sm',
        primary:
          'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024]/20 hover:bg-[#cda245] active:translate-y-[1px] shadow-sm',
        secondary:
          'bg-[#FFFFFF] text-[#0F0024] border-2 border-[#DAAE4F] hover:bg-[#DAAE4F]/10 active:translate-y-[1px]',
        outline:
          'border-2 border-[#0F0024] bg-transparent text-[#0F0024] hover:bg-[#0F0024]/5 active:translate-y-[1px]',
        ghost:
          'text-[#0F0024] hover:bg-[#0F0024]/10 active:bg-[#0F0024]/15',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:translate-y-[1px]',
        link:
          'text-[#0F0024] underline-offset-4 hover:underline hover:text-[#DAAE4F]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-[2px] px-3 text-xs',
        lg: 'h-12 rounded-[2px] px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
