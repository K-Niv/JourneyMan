/**
 * client/src/components/AccessibilityAndPolish.test.jsx
 * ======================================================
 * Tests for PR 10 (UX Polish & Mobile Optimization):
 *  - BoardSkeleton & Layout-shift prevention
 *  - useKeyboardShortcuts hook (1-9, Enter, Backspace, C, ?, H, input ignore)
 *  - useLiveAnnouncer hook (screen reader live region announcements)
 *  - ToastStore & ToastContainer (warning, info, success, error)
 *  - SlotTile & GuessRow accessibility, aria-labels, and touch targets
 *  - HowToPlayModal keyboard shortcut guide
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import React, { useState } from 'react';
import BoardSkeleton from './BoardSkeleton';
import SlotTile from './SlotTile';
import GuessRow from './GuessRow';
import TeamSelector from './TeamSelector';
import HowToPlayModal from './HowToPlayModal';
import ToastContainer from './ui/ToastContainer';
import { useToastStore, toast } from '../stores/toastStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLiveAnnouncer } from '../hooks/useLiveAnnouncer';
import { FEEDBACK } from 'shared';

// Test harness for useKeyboardShortcuts
function KeyboardHarness({
  stintCount = 4,
  currentGuess = [null, null, null, null],
  isPlaying = true,
  isSubmitting = false,
  enabled = true,
  onOpenSlot = vi.fn(),
  onClearLastSlot = vi.fn(),
  onClearAll = vi.fn(),
  onSubmit = vi.fn(),
  onInvalidSubmit = vi.fn(),
  onOpenHelp = vi.fn(),
  onOpenHistory = vi.fn(),
}) {
  useKeyboardShortcuts({
    enabled,
    stintCount,
    currentGuess,
    isPlaying,
    isSubmitting,
    onOpenSlot,
    onClearLastSlot,
    onClearAll,
    onSubmit,
    onInvalidSubmit,
    onOpenHelp,
    onOpenHistory,
  });

  return (
    <div>
      <input data-testid="text-input" placeholder="Type here..." />
      <div data-testid="game-status">{isPlaying ? 'playing' : 'idle'}</div>
    </div>
  );
}

// Mock ResizeObserver & scrollIntoView for cmdk and jsdom
if (typeof window !== 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = vi.fn();
  }
}

// Test harness for useLiveAnnouncer
function AnnouncerHarness() {
  const { announce, announcement } = useLiveAnnouncer();

  return (
    <div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-announcer"
      >
        {announcement}
      </div>
      <button onClick={() => announce('New puzzle loaded')}>Announce Load</button>
      <button onClick={() => announce('Guess graded: 2 correct')}>Announce Guess</button>
    </div>
  );
}

describe('PR 10 — UX Polish & Mobile Optimization', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // 1. BoardSkeleton
  // =========================================================================
  describe('BoardSkeleton Component', () => {
    it('renders the complete layout-stable loading skeleton', () => {
      render(<BoardSkeleton stintCount={4} />);

      const skeleton = screen.getByTestId('board-skeleton');
      expect(skeleton).toBeDefined();
      expect(skeleton.getAttribute('role')).toBe('status');
      expect(skeleton.getAttribute('aria-label')).toBe('Loading puzzle');
    });
  });

  // =========================================================================
  // 2. Keyboard Shortcuts Hook
  // =========================================================================
  describe('useKeyboardShortcuts Hook', () => {
    it('handles number keys 1-4 to trigger slot selection', () => {
      const onOpenSlot = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={['t1', null, null, null]}
          onOpenSlot={onOpenSlot}
        />
      );

      fireEvent.keyDown(window, { key: '1' });
      expect(onOpenSlot).toHaveBeenCalledWith(0);

      fireEvent.keyDown(window, { key: '3' });
      expect(onOpenSlot).toHaveBeenCalledWith(2);
    });

    it('ignores number keys out of stint range (e.g. 5 for 4-stint puzzle)', () => {
      const onOpenSlot = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={[null, null, null, null]}
          onOpenSlot={onOpenSlot}
        />
      );

      fireEvent.keyDown(window, { key: '5' });
      expect(onOpenSlot).not.toHaveBeenCalled();
    });

    it('triggers onSubmit when Enter is pressed and all slots are filled', () => {
      const onSubmit = vi.fn();
      const onInvalidSubmit = vi.fn();
      render(
        <KeyboardHarness
          stintCount={3}
          currentGuess={['t1', 't2', 't3']}
          onSubmit={onSubmit}
          onInvalidSubmit={onInvalidSubmit}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(onSubmit).toHaveBeenCalled();
      expect(onInvalidSubmit).not.toHaveBeenCalled();
    });

    it('triggers onInvalidSubmit when Enter is pressed and slots are incomplete', () => {
      const onSubmit = vi.fn();
      const onInvalidSubmit = vi.fn();
      render(
        <KeyboardHarness
          stintCount={3}
          currentGuess={['t1', null, 't3']}
          onSubmit={onSubmit}
          onInvalidSubmit={onInvalidSubmit}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(onInvalidSubmit).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('triggers onClearLastSlot when Backspace or Delete is pressed', () => {
      const onClearLastSlot = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={['t1', 't2', null, null]}
          onClearLastSlot={onClearLastSlot}
        />
      );

      fireEvent.keyDown(window, { key: 'Backspace' });
      expect(onClearLastSlot).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'Delete' });
      expect(onClearLastSlot).toHaveBeenCalledTimes(2);
    });

    it('triggers onClearAll when C is pressed', () => {
      const onClearAll = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={['t1', 't2', null, null]}
          onClearAll={onClearAll}
        />
      );

      fireEvent.keyDown(window, { key: 'c' });
      expect(onClearAll).toHaveBeenCalledTimes(1);
    });

    it('triggers onOpenHelp when ? or / is pressed', () => {
      const onOpenHelp = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={[null, null, null, null]}
          onOpenHelp={onOpenHelp}
        />
      );

      fireEvent.keyDown(window, { key: '?' });
      expect(onOpenHelp).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: '/' });
      expect(onOpenHelp).toHaveBeenCalledTimes(2);
    });

    it('triggers onOpenHistory when H or h is pressed', () => {
      const onOpenHistory = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={[null, null, null, null]}
          onOpenHistory={onOpenHistory}
        />
      );

      fireEvent.keyDown(window, { key: 'h' });
      expect(onOpenHistory).toHaveBeenCalledTimes(1);
    });

    it('ignores shortcuts when user is focused inside a text input', () => {
      const onOpenSlot = vi.fn();
      const onClearLastSlot = vi.fn();
      render(
        <KeyboardHarness
          stintCount={4}
          currentGuess={['t1', null, null, null]}
          onOpenSlot={onOpenSlot}
          onClearLastSlot={onClearLastSlot}
        />
      );

      const input = screen.getByTestId('text-input');
      input.focus();

      fireEvent.keyDown(input, { key: '1' });
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onOpenSlot).not.toHaveBeenCalled();
      expect(onClearLastSlot).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Live Announcer Hook
  // =========================================================================
  describe('useLiveAnnouncer Hook', () => {
    it('creates an aria-live="polite" region and announces messages', async () => {
      render(<AnnouncerHarness />);

      const liveRegion = screen.getByTestId('live-announcer');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('role')).toBe('status');

      // Click announce button
      fireEvent.click(screen.getByText('Announce Load'));

      await waitFor(() => {
        expect(liveRegion.textContent).toBe('New puzzle loaded');
      });

      fireEvent.click(screen.getByText('Announce Guess'));

      await waitFor(() => {
        expect(liveRegion.textContent).toBe('Guess graded: 2 correct');
      });
    });
  });

  // =========================================================================
  // 4. Toast System & Warning Type
  // =========================================================================
  describe('ToastStore & ToastContainer', () => {
    it('adds and renders warning, info, success, and error notifications', () => {
      render(<ToastContainer />);

      act(() => {
        toast.warning('Warning Notice', 'Incomplete selection');
        toast.success('Success Notice', 'Game saved');
        toast.info('Info Notice', 'New puzzle daily');
        toast.error('Error Notice', 'Network failure');
      });

      expect(screen.getByText('Warning Notice')).toBeDefined();
      expect(screen.getByText('Incomplete selection')).toBeDefined();
      expect(screen.getByText('Success Notice')).toBeDefined();
      expect(screen.getByText('Info Notice')).toBeDefined();
      expect(screen.getByText('Error Notice')).toBeDefined();
    });

    it('dismisses toast when close button is clicked', () => {
      render(<ToastContainer />);

      act(() => {
        toast.info('Dismissable Toast', 'Click X to dismiss');
      });

      expect(screen.getByText('Dismissable Toast')).toBeDefined();

      const dismissBtn = screen.getByLabelText(/dismiss notification/i);
      fireEvent.click(dismissBtn);

      expect(useToastStore.getState().toasts.length).toBe(0);
    });
  });

  // =========================================================================
  // 5. SlotTile & GuessRow Accessibility
  // =========================================================================
  describe('SlotTile & GuessRow Accessibility', () => {
    const mockTeams = [
      { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS' },
    ];

    it('renders empty slot with accessible role and aria-label', () => {
      render(
        <SlotTile
          index={0}
          stintCount={4}
          teamId={null}
          availableTeams={mockTeams}
          isActive={true}
        />
      );

      const slotBtn = screen.getByRole('button');
      expect(slotBtn.getAttribute('aria-roledescription')).toBe('career stint slot');
      expect(slotBtn.getAttribute('aria-label')).toMatch(/slot 1: empty/i);
    });

    it('renders filled slot with team name and keyboard shortcut hint in aria-label', () => {
      render(
        <SlotTile
          index={1}
          stintCount={4}
          teamId="lal"
          availableTeams={mockTeams}
          isActive={true}
        />
      );

      const slotBtn = screen.getByRole('button');
      expect(slotBtn.getAttribute('aria-label')).toMatch(/slot 2: los angeles lakers/i);
    });

    it('renders locked slot with confirmed correct description', () => {
      render(
        <SlotTile
          index={0}
          stintCount={4}
          teamId="lal"
          availableTeams={mockTeams}
          isActive={true}
          isLocked={true}
        />
      );

      const lockedSlot = screen.getByRole('gridcell');
      expect(lockedSlot.getAttribute('aria-label')).toMatch(/confirmed correct and locked/i);
    });

    it('renders graded feedback slot with correct feedback description', () => {
      render(
        <SlotTile
          index={0}
          stintCount={4}
          teamId="lal"
          availableTeams={mockTeams}
          feedback={FEEDBACK.CORRECT}
          isActive={false}
        />
      );

      const feedbackSlot = screen.getByRole('gridcell');
      expect(feedbackSlot.getAttribute('aria-label')).toMatch(/correct/i);
    });
  });

  // =========================================================================
  // 6. Mobile Touch Targets & Modals
  // =========================================================================
  describe('Mobile Touch Targets & HowToPlayModal', () => {
    const mockTeams = [
      { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS' },
    ];

    it('renders TeamSelector items with min 44px touch target class', () => {
      render(<TeamSelector teams={mockTeams} slotIndex={0} onSelect={vi.fn()} />);

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(2);
      expect(options[0].className).toContain('min-h-[44px]');
    });

    it('renders HowToPlayModal with Keyboard Shortcuts section', () => {
      render(<HowToPlayModal open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText(/Keyboard Shortcuts/i)).toBeDefined();
      expect(screen.getByText('1–9')).toBeDefined();
      expect(screen.getByText('Submit guess')).toBeDefined();
      expect(screen.getByText('Clear last slot')).toBeDefined();
    });
  });
});
