/**
 * client/src/components/Header.jsx
 * ==================================
 * Compact top bar for the JourneyMan game.
 *
 * Layout: [? Help]  ──  JourneyMan Title  ──  [📅 Calendar] [👤 User / Profile]
 *
 * The ? button opens the HowToPlayModal.
 * The Calendar icon is a disabled placeholder for PR10's history view.
 * The User icon opens the AuthModal for guest users or a profile popover for logged-in users.
 */

import { useState } from 'react';
import { HelpCircle, Calendar, User, LogOut, ShieldCheck } from 'lucide-react';
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

  return (
    <TooltipProvider delayDuration={300}>
      <header className="w-full max-w-lg mx-auto flex items-center justify-between px-2 py-3">
        {/* Left — Help button */}
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="help-button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setShowHelp(true)}
                aria-label="How to play"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>How to Play</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center — Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            JourneyMan
          </h1>
          {puzzleNumber && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              Puzzle #{puzzleNumber} · {puzzleDate}
            </p>
          )}
        </div>

        {/* Right — Actions: Calendar + Auth/Profile */}
        <div className="flex items-center gap-1">
          {/* Calendar / History Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="calendar-button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="History & Stats"
                onClick={() => {
                  if (user) {
                    setShowHistoryModal(true);
                  } else {
                    toast.info(
                      'Sign in to view your history',
                      'Create a free account or sign in to track your streaks, stats, and calendar history.'
                    );
                    setShowAuthModal(true);
                  }
                }}
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>History & Stats</p>
            </TooltipContent>
          </Tooltip>

          {/* User Auth / Profile Button */}
          {user ? (
            <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="user-profile-button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-slate-800 text-amber-400 p-0"
                  aria-label="User profile"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-400">
                    {userInitial}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                className="w-64 bg-slate-950/95 backdrop-blur border-slate-800 p-4 rounded-xl shadow-2xl text-slate-100"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {user.displayName || 'JourneyMan Player'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Account Active</span>
                  </div>

                  <hr className="border-slate-800" />

                  <Button
                    id="logout-button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
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
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => setShowAuthModal(true)}
                  aria-label="Sign In or Register"
                >
                  <User className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Sign In / Register</p>
              </TooltipContent>
            </Tooltip>
          )}
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
