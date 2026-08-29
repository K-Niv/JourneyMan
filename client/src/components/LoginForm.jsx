/**
 * client/src/components/LoginForm.jsx
 * ====================================
 * Controlled form for user login with Poeltl brand system.
 */

import { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { Button } from './ui/button';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const login = useAuthStore((s) => s.login);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const authError = useAuthStore((s) => s.authError);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    const success = await login(trimmedEmail, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const displayedError = formError || authError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {displayedError && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 border-2 border-red-700 text-red-900 shadow-brutal-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-semibold">{displayedError}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#0F0024] uppercase tracking-wider block font-poeltl">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#5A5A5A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="login-email-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (displayedError) {
                setFormError('');
                clearAuthError();
              }
            }}
            placeholder="you@example.com"
            disabled={isAuthLoading}
            className="w-full bg-white border-2 border-[#0F0024] rounded-none pl-9 pr-3.5 py-2.5 text-sm text-[#212121] placeholder:text-[#5A5A5A]/60 shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-[#DAAE4F] transition-colors disabled:opacity-50 font-sans"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#0F0024] uppercase tracking-wider block font-poeltl">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#5A5A5A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="login-password-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (displayedError) {
                setFormError('');
                clearAuthError();
              }
            }}
            placeholder="••••••••"
            disabled={isAuthLoading}
            className="w-full bg-white border-2 border-[#0F0024] rounded-none pl-9 pr-3.5 py-2.5 text-sm text-[#212121] placeholder:text-[#5A5A5A]/60 shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-[#DAAE4F] transition-colors disabled:opacity-50 font-sans"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        id="login-submit-button"
        type="submit"
        variant="primary"
        disabled={isAuthLoading}
        className="w-full bg-[#DAAE4F] text-[#0F0024] hover:bg-[#cda245] font-extrabold py-3 rounded-[2px] shadow-brutal hover:shadow-brutal-lg transition-all mt-3 tracking-wider uppercase text-sm"
      >
        {isAuthLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
