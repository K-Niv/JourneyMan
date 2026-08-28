/**
 * client/src/components/ui/ToastContainer.jsx
 * ===========================================
 * Floating toast notification container rendered at the root of the app.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all',
                isSuccess && 'bg-slate-950/95 border-emerald-500/40 text-slate-100 shadow-emerald-500/10',
                isError && 'bg-slate-950/95 border-red-500/40 text-slate-100 shadow-red-500/10',
                !isSuccess && !isError && 'bg-slate-950/95 border-slate-700 text-slate-100'
              )}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-amber-400" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-sm font-semibold text-slate-100 leading-tight">
                  {t.message}
                </p>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-md hover:bg-slate-800/60 shrink-0"
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
