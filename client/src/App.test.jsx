import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App Component', () => {
  it('renders JourneyMan header title', () => {
    render(<App />);
    const heading = screen.getByText('JourneyMan');
    expect(heading).toBeDefined();
  });
});
