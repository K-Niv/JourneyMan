/**
 * client/src/components/ui/ToastContainer.jsx
 * ===========================================
 * Floating toast notification container rendered at the root of the app.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';
          const isError = t.type === 'error';

          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-none border-2 border-[#0F0024] bg-white text-[#212121] shadow-brutal transition-all font-sans',
                isSuccess && 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-[3px_3px_0px_#065F46]',
                isWarning && 'border-[#DAAE4F] bg-[#FFFBEB] text-[#78350F] shadow-[3px_3px_0px_#DAAE4F]',
                isError && 'border-red-700 bg-red-50 text-red-950 shadow-[3px_3px_0px_#991B1B]',
                !isSuccess && !isWarning && !isError && 'border-[#0F0024] bg-white text-[#0F0024]'
              )}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-[#B45309]" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-[#0F0024]" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-sm font-bold text-[#0F0024] leading-tight font-poeltl">
                  {t.message}
                </p>
                {t.description && (
                  <p className="text-xs text-[#5A5A5A] mt-1 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#0F0024] hover:bg-[#0F0024]/10 transition-colors p-0.5 rounded-[2px] shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
