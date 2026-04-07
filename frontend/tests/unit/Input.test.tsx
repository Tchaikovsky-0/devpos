import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input } from '../../src/components/ui/Input';

describe('Input Component', () => {
  it('should render input with placeholder', () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should render with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should render disabled input', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should render different types', () => {
    const { container } = render(<Input type="text" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'text');

    const { container: c2 } = render(<Input type="email" />);
    expect(c2.querySelector('input')).toHaveAttribute('type', 'email');

    const { container: c3 } = render(<Input type="password" />);
    expect(c3.querySelector('input')).toHaveAttribute('type', 'password');

    const { container: c4 } = render(<Input type="number" />);
    expect(c4.querySelector('input')).toHaveAttribute('type', 'number');
  });

  it('should render with hint text', () => {
    render(<Input hint="Must be at least 8 characters" />);
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('should render required indicator', () => {
    render(<Input label="Email" required />);
    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();
  });

  it('should render with prefix and suffix', () => {
    const prefix = <span data-testid="prefix">$</span>;
    const suffix = <span data-testid="suffix">.00</span>;
    
    render(<Input prefix={prefix} suffix={suffix} />);
    
    expect(screen.getByTestId('prefix')).toBeInTheDocument();
    expect(screen.getByTestId('suffix')).toBeInTheDocument();
  });
});
