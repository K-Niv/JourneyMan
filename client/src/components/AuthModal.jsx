/**
 * client/src/components/AuthModal.jsx
 * ====================================
 * Modal dialog for user authentication (Sign In & Register).
 *
 * Uses shadcn Dialog with tabbed switching between LoginForm and RegisterForm.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuthStore } from '../stores/authStore';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthModal({ open, onOpenChange, initialMode = 'login' }) {
  const [tab, setTab] = useState(initialMode);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    clearAuthError();
  };

  const handleSuccess = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) clearAuthError();
        if (onOpenChange) onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-sm sm:max-w-md bg-slate-950/95 backdrop-blur-xl border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {tab === 'login' ? 'Welcome Back' : 'Join JourneyMan'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            {tab === 'login'
              ? 'Sign in to sync your stats and streaks across devices.'
              : 'Create an account to track your daily stats, streaks, and solve history.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mt-2">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => handleTabChange('login')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
              tab === 'login'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            id="auth-tab-register"
            onClick={() => handleTabChange('register')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
              tab === 'register'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        {tab === 'login' ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
