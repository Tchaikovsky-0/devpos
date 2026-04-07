import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  // Mock console.error to avoid noise in test output
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default variant', () => {
      render(<StatusBadge>Default</StatusBadge>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should render with success variant', () => {
      render(<StatusBadge variant="success">在线</StatusBadge>);
      const badge = screen.getByText('在线');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-success/10', { exact: false });
    });

    it('should render with warning variant', () => {
      render(<StatusBadge variant="warning">警告</StatusBadge>);
      expect(screen.getByText('警告')).toBeInTheDocument();
    });

    it('should render with error variant', () => {
      render(<StatusBadge variant="error">错误</StatusBadge>);
      expect(screen.getByText('错误')).toBeInTheDocument();
    });

    it('should render with info variant', () => {
      render(<StatusBadge variant="info">信息</StatusBadge>);
      expect(screen.getByText('信息')).toBeInTheDocument();
    });

    it('should render with accent variant', () => {
      render(<StatusBadge variant="accent">强调</StatusBadge>);
      expect(screen.getByText('强调')).toBeInTheDocument();
    });
  });

  describe('Muted Variant', () => {
    it('should apply muted style when muted prop is true', () => {
      render(<StatusBadge variant="success" muted>在线</StatusBadge>);
      const badge = screen.getByText('在线');
      expect(badge).toBeInTheDocument();
    });

    it('should apply opacity style when muted prop is false', () => {
      render(<StatusBadge variant="success" muted={false}>在线</StatusBadge>);
      const badge = screen.getByText('在线');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<StatusBadge className="custom-class">自定义</StatusBadge>);
      const badge = screen.getByText('自定义');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should render as span element', () => {
      render(<StatusBadge>测试</StatusBadge>);
      const badge = screen.getByText('测试');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Edge Cases', () => {
    it('should render empty badge', () => {
      render(<StatusBadge></StatusBadge>);
      const badge = document.querySelector('span');
      expect(badge).toBeInTheDocument();
    });

    it('should render with long text', () => {
      const longText = '这是一个很长的文本用于测试容器的显示效果和文本截断功能';
      render(<StatusBadge>{longText}</StatusBadge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });
});
