/**
 * client/src/components/LandingAndLibrary.test.jsx
 * ==================================================
 * Tests for the new LandingPage, AuthPage, and Poeltl Component Library primitives.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuthStore } from '../stores/authStore';

describe('Poeltl Revamp: LandingPage & Component Library', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('LandingPage', () => {
    it('renders Hero with headline, subtitle, and primary/secondary CTAs', () => {
      const handlePlay = vi.fn();
      const handleHelp = vi.fn();
      const handleAuth = vi.fn();

      render(
        <LandingPage
          onPlay={handlePlay}
          onOpenHelp={handleHelp}
          onOpenAuth={handleAuth}
          puzzleNumber={42}
          puzzleDate="2026-08-28"
        />
      );

      // Headline & Subtitle
      expect(screen.getByText('GUESS THE NBA CAREER TIMELINE')).toBeDefined();

      // Action CTAs
      const playBtn = screen.getByRole('button', { name: /play today's puzzle/i });
      expect(playBtn).toBeDefined();
      fireEvent.click(playBtn);
      expect(handlePlay).toHaveBeenCalledTimes(1);

      const howToPlayBtn = screen.getByRole('button', { name: /how to play/i });
      expect(howToPlayBtn).toBeDefined();
      fireEvent.click(howToPlayBtn);
      expect(handleHelp).toHaveBeenCalledTimes(1);
    });

    it('renders the interactive demo preview with correct, misplaced, and wrong stint (Toronto Raptors)', () => {
      render(
        <LandingPage
          onPlay={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      );

      // Demo preview title
      expect(screen.getByText(/Live Puzzle Preview: LeBron James/i)).toBeDefined();

      // Demo stints
      expect(screen.getByText('CLE')).toBeDefined();
      expect(screen.getByText('Cavaliers')).toBeDefined();
      expect(screen.getByText('MIA')).toBeDefined();
      expect(screen.getByText('Heat')).toBeDefined();
      expect(screen.getByText('LAL')).toBeDefined();
      expect(screen.getByText('Lakers')).toBeDefined();
      expect(screen.getByText('TOR')).toBeDefined();
      expect(screen.getByText('Raptors')).toBeDefined();

      // Status badges
      expect(screen.getAllByText('Exact Stint').length).toBe(2);
      expect(screen.getByText('Misplaced Stint')).toBeDefined();
      expect(screen.getByText('Wrong Team')).toBeDefined();

      // Color legend
      expect(screen.getAllByText(/Exact/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Misplaced/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Wrong Team/i).length).toBeGreaterThan(0);
    });
  });

  describe('AuthPage', () => {
    it('renders AuthPage with tabs for Sign In and Register', () => {
      const handleBack = vi.fn();
      const handlePlay = vi.fn();

      render(<AuthPage onBack={handleBack} onPlay={handlePlay} defaultTab="login" />);

      expect(screen.getByText('Player Sign In')).toBeDefined();
      expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
      expect(screen.getByText('Back')).toBeDefined();

      // Switch to Register tab
      const registerTab = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerTab);
      expect(screen.getByPlaceholderText('e.g. LeBronStan23')).toBeDefined();
    });

    it('fires onBack when clicking back button', () => {
      const handleBack = vi.fn();
      render(<AuthPage onBack={handleBack} />);

      const backBtn = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Library Primitives', () => {
    it('renders Button with variants and sizes', () => {
      render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="destructive">Destructive Button</Button>
        </div>
      );

      expect(screen.getByText('Primary Button')).toBeDefined();
      expect(screen.getByText('Secondary Button')).toBeDefined();
      expect(screen.getByText('Outline Button')).toBeDefined();
      expect(screen.getByText('Ghost Button')).toBeDefined();
      expect(screen.getByText('Destructive Button')).toBeDefined();
    });

    it('renders Card components with header, title, content, and footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card Title</CardTitle>
            <CardDescription>Test Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card body content</p>
          </CardContent>
          <CardFooter>
            <Button>Footer Action</Button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card Title')).toBeDefined();
      expect(screen.getByText('Test Card Description')).toBeDefined();
      expect(screen.getByText('Card body content')).toBeDefined();
      expect(screen.getByText('Footer Action')).toBeDefined();
    });

    it('renders Input with error state and styling', () => {
      render(<Input placeholder="Type here..." error={true} />);
      const input = screen.getByPlaceholderText('Type here...');
      expect(input).toBeDefined();
      expect(input.className).toContain('border-red-600');
    });

    it('renders Badge variants', () => {
      render(
        <div>
          <Badge variant="default">Gold Badge</Badge>
          <Badge variant="secondary">Midnight Badge</Badge>
          <Badge variant="court">Court Badge</Badge>
          <Badge variant="destructive">Red Badge</Badge>
        </div>
      );

      expect(screen.getByText('Gold Badge')).toBeDefined();
      expect(screen.getByText('Midnight Badge')).toBeDefined();
      expect(screen.getByText('Court Badge')).toBeDefined();
      expect(screen.getByText('Red Badge')).toBeDefined();
    });
  });
});
