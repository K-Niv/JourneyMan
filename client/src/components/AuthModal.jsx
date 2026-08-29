/**
 * client/src/components/AuthModal.jsx
 * ====================================
 * Modal dialog for user authentication (Sign In & Register) with Poeltl brand system.
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
      <DialogContent className="max-w-sm sm:max-w-md bg-white border-2 border-[#0F0024] text-[#212121] p-6 rounded-none shadow-brutal">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#DAAE4F] border border-[#0F0024] text-[#0F0024] shadow-brutal-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-[#0F0024] font-poeltl uppercase tracking-wide">
              {tab === 'login' ? 'Welcome Back' : 'Join JourneyMan'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#5A5A5A]">
            {tab === 'login'
              ? 'Sign in to sync your stats and streaks across devices.'
              : 'Create an account to track your daily stats, streaks, and solve history.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Toggle */}
        <div className="flex bg-[#F5ECDF] p-1 border-2 border-[#0F0024] mt-2">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => handleTabChange('login')}
            className={cn(
              'flex-1 py-1.5 text-xs font-bold font-poeltl tracking-wider uppercase transition-all',
              tab === 'login'
                ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            id="auth-tab-register"
            onClick={() => handleTabChange('register')}
            className={cn(
              'flex-1 py-1.5 text-xs font-bold font-poeltl tracking-wider uppercase transition-all',
              tab === 'register'
                ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
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
