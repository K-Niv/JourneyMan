/**
 * client/src/components/AuthPage.jsx
 * ====================================
 * Dedicated full-page authentication view matching the Poeltl brand system.
 * Supports Login & Signup with robust validation, tab switcher, and return CTAs.
 */

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Trophy, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthPage({ onBack, onPlay, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10 flex flex-col items-center">
      {/* Back button */}
      <div className="w-full flex items-center justify-between mb-6">
        <Button
          id="auth-back-button"
          variant="outline"
          size="sm"
          onClick={onBack}
          className="shadow-brutal-sm font-bold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>
        <Badge variant="gold" className="text-[11px]">
          COURT ACCESS
        </Badge>
      </div>

      {/* Main Auth Card */}
      <Card variant="shadow" className="w-full bg-white border-2 border-[#0F0024]">
        <CardHeader className="text-center pb-4 border-b-2 border-[#0F0024]">
          <div className="mx-auto w-12 h-12 bg-[#DAAE4F] border-2 border-[#0F0024] flex items-center justify-center shadow-brutal-sm mb-3">
            <Trophy className="w-6 h-6 text-[#0F0024]" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#0F0024] font-poeltl uppercase">
            {tab === 'login' ? 'Player Sign In' : 'Join JourneyMan'}
          </CardTitle>
          <CardDescription className="text-xs text-[#5A5A5A] mt-1">
            {tab === 'login'
              ? 'Access your solve streaks, calendar history, and personal stats.'
              : 'Create a free account to track your daily stats and compete on leaderboards.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-[#F5ECDF] p-1 border-2 border-[#0F0024]">
            <button
              type="button"
              id="auth-page-tab-login"
              onClick={() => setTab('login')}
              className={cn(
                'flex-1 py-2 text-xs font-bold font-poeltl tracking-wider uppercase transition-all',
                tab === 'login'
                  ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                  : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-page-tab-register"
              onClick={() => setTab('register')}
              className={cn(
                'flex-1 py-2 text-xs font-bold font-poeltl tracking-wider uppercase transition-all',
                tab === 'register'
                  ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                  : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Active Form */}
          {tab === 'login' ? (
            <LoginForm onSuccess={onPlay || onBack} />
          ) : (
            <RegisterForm onSuccess={onPlay || onBack} />
          )}

          {/* Feature Highlights */}
          <div className="mt-6 pt-4 border-t border-[#0F0024]/15 grid grid-cols-2 gap-2 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F0024]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Cloud Saved Streaks</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F0024]">
              <Zap className="w-3.5 h-3.5 text-[#DAAE4F] shrink-0" />
              <span>Full Archive Access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
