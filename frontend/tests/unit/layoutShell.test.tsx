import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeToggle } from '../../src/components/ThemeToggle';

describe('Shell Layout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'deep');
  });

  it('toggles the document theme between dark and light', () => {
    render(<ThemeToggle />);

    // 三档主题系统：deep → balanced → light 循环
    expect(document.documentElement.getAttribute('data-theme')).toBe('deep');

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const theme = document.documentElement.getAttribute('data-theme');
    expect(theme).toBe('balanced');
  });

  it('renders ThemeToggle as accessible button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
