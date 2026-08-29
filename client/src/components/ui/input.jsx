/**
 * client/src/components/ui/input.jsx
 * ====================================
 * Poeltl-inspired Form Input with sharp borders, bold #0F0024 border styling,
 * #DAAE4F focus ring, and clean states.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-none border-2 border-[#0F0024] bg-white px-3.5 py-2 text-sm text-[#212121] placeholder:text-[#5A5A5A]/60 font-sans shadow-brutal-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAAE4F] focus-visible:border-[#0F0024] disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-600 focus-visible:ring-red-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
