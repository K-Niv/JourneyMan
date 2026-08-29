/**
 * client/src/components/ui/badge.jsx
 * ====================================
 * Poeltl-inspired Badge component with sharp borders and athletic accents.
 */

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-none border border-[#0F0024] px-2 py-0.5 text-xs font-bold font-poeltl tracking-wider uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#DAAE4F] text-[#0F0024]',
        secondary: 'bg-[#0F0024] text-[#F5ECDF]',
        outline: 'bg-transparent text-[#0F0024]',
        destructive: 'bg-red-600 text-white border-red-800',
        gold: 'bg-[#DAAE4F] text-[#0F0024] shadow-brutal-sm',
        cream: 'bg-[#F5ECDF] text-[#0F0024]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
