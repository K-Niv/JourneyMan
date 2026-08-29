/**
 * client/src/components/ui/skeleton.jsx
 * =====================================
 * Reusable animated skeleton placeholder for loading states.
 */

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-800/70',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
