/**
 * client/src/components/RegisterForm.jsx
 * =======================================
 * Controlled form for user account registration.
 */

import { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { Button } from './ui/button';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm({ onSuccess }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const register = useAuthStore((s) => s.register);
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

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const success = await register(trimmedEmail, password, displayName.trim());
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const displayedError = formError || authError;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
      {displayedError && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{displayedError}</span>
        </div>
      )}

      {/* Display Name Input (Optional) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Display Name <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="register-name-input"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. LeBronStan23"
            disabled={isAuthLoading}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="register-email-input"
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
          Password <span className="text-slate-500 font-normal">(min. 8 characters)</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="register-password-input"
            type="password"
            autoComplete="new-password"
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

      {/* Confirm Password Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="register-confirm-password-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
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
        id="register-submit-button"
        type="submit"
        disabled={isAuthLoading}
        className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold py-2.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all mt-2"
      >
        {isAuthLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account…
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
