import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Loading, Skeleton, CardSkeleton } from '../../src/components/Loading';

describe('Loading Components', () => {
  describe('Loading', () => {
    it('should render loading with default props', () => {
      render(<Loading />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });

    it('should render loading with custom text', () => {
      render(<Loading text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render different sizes', () => {
      const { rerender } = render(<Loading size="sm" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Loading size="md" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Loading size="lg" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Skeleton', () => {
    it('should render skeleton with default lines', () => {
      const { container } = render(<Skeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render skeleton with custom lines', () => {
      const { container } = render(<Skeleton lines={3} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });
  });

  describe('CardSkeleton', () => {
    it('should render card skeleton', () => {
      const { container } = render(<CardSkeleton />);
      const cardSkeleton = container.querySelector('.animate-pulse');
      expect(cardSkeleton).toBeInTheDocument();
    });
  });
});
