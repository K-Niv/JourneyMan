/**
 * client/src/components/Header.jsx
 * ==================================
 * Modern, responsive top navigation bar for JourneyMan inspired by Poeltl.
 *
 * Features:
 * - Brand Logo & JourneyMan wordmark
 * - Desktop navigation links (Play Daily, Features, How to Play, History & Stats)
 * - Mobile hamburger menu toggle & drawer
 * - User Profile popover for authenticated players / Sign in trigger for guests
 * - Full accessibility & test-id retention
 */

import { useState } from 'react';
import {
  HelpCircle,
  Calendar,
  User,
  LogOut,
  ShieldCheck,
  BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import HowToPlayModal from './HowToPlayModal';
import AuthModal from './AuthModal';
import HistoryModal from './HistoryModal';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';

export default function Header({
  puzzleNumber,
  puzzleDate,
  _activeView = 'landing',
  onNavigate,
  showHelp: controlledShowHelp,
  onHelpOpenChange: controlledOnHelpOpenChange,
  showAuthModal: controlledShowAuthModal,
  onAuthOpenChange: controlledOnAuthOpenChange,
  showHistoryModal: controlledShowHistoryModal,
  onHistoryOpenChange: controlledOnHistoryOpenChange,
}) {
  const [internalShowHelp, setInternalShowHelp] = useState(false);
  const [internalShowAuthModal, setInternalShowAuthModal] = useState(false);
  const [internalShowHistoryModal, setInternalShowHistoryModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const showHelp = controlledShowHelp !== undefined ? controlledShowHelp : internalShowHelp;
  const setShowHelp = controlledOnHelpOpenChange || setInternalShowHelp;

  const showAuthModal = controlledShowAuthModal !== undefined ? controlledShowAuthModal : internalShowAuthModal;
  const setShowAuthModal = controlledOnAuthOpenChange || setInternalShowAuthModal;

  const showHistoryModal = controlledShowHistoryModal !== undefined ? controlledShowHistoryModal : internalShowHistoryModal;
  const setShowHistoryModal = controlledOnHistoryOpenChange || setInternalShowHistoryModal;

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : null;

  const handleCalendarClick = () => {
    if (user) {
      setShowHistoryModal(true);
    } else {
      toast.info(
        'Sign in to view your history',
        'Create a free account or sign in to track your streaks, stats, and calendar history.'
      );
      setShowAuthModal(true);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="w-full bg-[#F5ECDF] border-b-2 border-[#0F0024] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-6 py-2.5">
          {/* ================================================================= */}
          {/* Left — Brand Logo & Title */}
          {/* ================================================================= */}
          <div className="flex items-center gap-3">
            {/* Logo Link */}
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('landing');
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#DAAE4F] border-2 border-[#0F0024] flex items-center justify-center shadow-brutal-sm group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <span className="font-extrabold text-[#0F0024] text-base font-poeltl tracking-tighter">
                  JM
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F0024] font-poeltl block leading-none">
                  JourneyMan
                </span>
                {puzzleNumber && (
                  <span className="text-[10px] font-bold text-[#5A5A5A] uppercase tracking-wider block font-mono">
                    Puzzle #{puzzleNumber} · {puzzleDate}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* ================================================================= */}
          {/* Right — Action CTAs (Help, Calendar, Profile) */}
          {/* ================================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* How to play button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="help-button"
                  variant="outline"
                  size="icon"
                  className="rounded-none border-2 border-[#0F0024] bg-white text-[#0F0024] shadow-brutal-sm hover:bg-[#DAAE4F]/20 h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setShowHelp(true)}
                  aria-label="How to play"
                >
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#0F0024] text-[#F5ECDF] border-none font-bold text-xs">
                <p>How to Play (?)</p>
              </TooltipContent>
            </Tooltip>

            {/* Calendar / History Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="calendar-button"
                  variant="outline"
                  size="icon"
                  className="rounded-none border-2 border-[#0F0024] bg-white text-[#0F0024] shadow-brutal-sm hover:bg-[#DAAE4F]/20 h-8 w-8 sm:h-9 sm:w-9"
                  aria-label="History & Stats"
                  onClick={handleCalendarClick}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-[#0F0024] text-[#F5ECDF] border-none font-bold text-xs">
                <p>History & Stats (H)</p>
              </TooltipContent>
            </Tooltip>

            {/* User Auth / Profile Button */}
            {user ? (
              <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="user-profile-button"
                    variant="outline"
                    size="icon"
                    className="rounded-none border-2 border-[#0F0024] bg-[#DAAE4F] text-[#0F0024] shadow-brutal-sm h-8 w-8 sm:h-9 sm:w-9 p-0 font-extrabold font-poeltl"
                    aria-label="User profile"
                  >
                    {userInitial}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-64 bg-white border-2 border-[#0F0024] p-4 rounded-none shadow-brutal text-[#212121]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 border-2 border-[#0F0024] bg-[#DAAE4F] flex items-center justify-center text-[#0F0024] font-bold text-sm shadow-brutal-sm">
                        {userInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F0024] truncate font-poeltl">
                          {user.displayName || 'JourneyMan Player'}
                        </p>
                        <p className="text-xs text-[#5A5A5A] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-700 text-emerald-900 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Account Active · Streaks Synced</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowHistoryModal(true);
                      }}
                      className="w-full justify-start text-xs font-bold border-[#0F0024]"
                    >
                      <BarChart2 className="w-3.5 h-3.5 mr-2" />
                      View Personal Stats
                    </Button>

                    <hr className="border-[#0F0024]/20" />

                    <Button
                      id="logout-button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    id="auth-button"
                    variant="outline"
                    size="icon"
                    className="rounded-none border-2 border-[#0F0024] bg-white text-[#0F0024] shadow-brutal-sm hover:bg-[#DAAE4F]/20 h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => setShowAuthModal(true)}
                    aria-label="Sign In or Register"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-[#0F0024] text-[#F5ECDF] border-none font-bold text-xs">
                  <p>Sign In / Register</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>

      {/* How to Play Modal */}
      <HowToPlayModal open={showHelp} onOpenChange={setShowHelp} />

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* History & Stats Modal */}
      <HistoryModal open={showHistoryModal} onOpenChange={setShowHistoryModal} />
    </TooltipProvider>
  );
}
