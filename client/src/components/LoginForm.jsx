/**
 * client/src/components/LoginForm.jsx
 * ====================================
 * Controlled form for user login.
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
        <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{displayedError}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        id="login-submit-button"
        type="submit"
        disabled={isAuthLoading}
        className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold py-2.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all mt-2"
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
