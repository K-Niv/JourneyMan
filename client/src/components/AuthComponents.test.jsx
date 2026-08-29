/**
 * client/src/components/AuthComponents.test.jsx
 * ==============================================
 * Tests for authentication components: LoginForm, RegisterForm, AuthModal, and Header auth integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AuthModal from './AuthModal';
import Header from './Header';
import { useAuthStore } from '../stores/authStore';

describe('Auth Components', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('LoginForm', () => {
    it('renders email and password inputs', () => {
      render(<LoginForm onSuccess={vi.fn()} />);

      expect(screen.getByText('Email Address')).toBeDefined();
      expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
      expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    });

    it('shows validation error when submitting with empty fields', async () => {
      render(<LoginForm onSuccess={vi.fn()} />);

      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/please enter your email address/i)).toBeDefined();
    });

    it('shows validation error when password is empty', async () => {
      render(<LoginForm onSuccess={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/please enter your password/i)).toBeDefined();
    });
  });

  describe('RegisterForm', () => {
    it('renders display name, email, password, and confirm password fields', () => {
      render(<RegisterForm onSuccess={vi.fn()} />);

      expect(screen.getByPlaceholderText(/lebronstan23/i)).toBeDefined();
      expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
      expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
    });

    it('validates password minimum length (8 chars)', async () => {
      render(<RegisterForm onSuccess={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const pwdInputs = screen.getAllByPlaceholderText('••••••••');
      fireEvent.change(pwdInputs[0], { target: { value: 'short' } });
      fireEvent.change(pwdInputs[1], { target: { value: 'short' } });

      const submitBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/at least 8 characters long/i)).toBeDefined();
    });

    it('validates matching confirm password', async () => {
      render(<RegisterForm onSuccess={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const pwdInputs = screen.getAllByPlaceholderText('••••••••');
      fireEvent.change(pwdInputs[0], { target: { value: 'password123' } });
      fireEvent.change(pwdInputs[1], { target: { value: 'different123' } });

      const submitBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/passwords do not match/i)).toBeDefined();
    });
  });

  describe('AuthModal', () => {
    it('switches between Sign In and Create Account tabs', () => {
      render(<AuthModal open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText('Welcome Back')).toBeDefined();
      const registerTab = document.getElementById('auth-tab-register');
      expect(registerTab).not.toBeNull();

      fireEvent.click(registerTab);

      expect(screen.getByText('Join JourneyMan')).toBeDefined();
    });
  });

  describe('Header Auth Integration', () => {
    it('renders help button, title, calendar button, and auth button for guest', () => {
      render(<Header puzzleNumber={42} puzzleDate="2026-08-28" />);

      expect(screen.getByRole('button', { name: /how to play/i })).toBeDefined();
      expect(screen.getByText('JourneyMan')).toBeDefined();
      expect(screen.getByText(/puzzle #42/i)).toBeDefined();

      const calendarBtn = screen.getByRole('button', { name: /history/i });
      expect(calendarBtn).toBeDefined();
      expect(calendarBtn.hasAttribute('disabled')).toBe(false);

      const authBtn = screen.getByRole('button', { name: /sign in or register/i });
      expect(authBtn).toBeDefined();
    });

    it('renders user initial avatar when user is logged in', () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'king@example.com',
          displayName: 'LeBron',
          createdAt: new Date().toISOString(),
        },
        token: 'test-token',
      });

      render(<Header puzzleNumber={42} puzzleDate="2026-08-28" />);

      const userBtn = screen.getByRole('button', { name: /user profile/i });
      expect(userBtn).toBeDefined();
      expect(screen.getByText('L')).toBeDefined();
    });
  });
});
