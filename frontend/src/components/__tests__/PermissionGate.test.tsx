import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PermissionGate from '@/components/PermissionGate';

// Helper to create a minimal Redux store with a given role
function createMockStore(role: string) {
  return configureStore({
    reducer: {
      auth: () => ({
        user: role ? { role } : null,
        token: 'mock-token',
        loading: false,
        error: null,
      }),
    },
  });
}

function renderWithStore(ui: React.ReactElement, role: string) {
  const store = createMockStore(role);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('PermissionGate', () => {
  it('renders children when user has permission', () => {
    renderWithStore(
      <PermissionGate permission="alert:read">
        <span data-testid="protected">Visible</span>
      </PermissionGate>,
      'admin',
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('renders fallback when user lacks permission', () => {
    renderWithStore(
      <PermissionGate permission="alert:delete" fallback={<span data-testid="denied">No access</span>}>
        <span data-testid="protected">Visible</span>
      </PermissionGate>,
      'viewer',
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });

  it('renders nothing (null) when user lacks permission and no fallback given', () => {
    const { container } = renderWithStore(
      <PermissionGate permission="role:delete">
        <span data-testid="protected">Visible</span>
      </PermissionGate>,
      'viewer',
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  it('anyPermission mode renders when user has at least one', () => {
    renderWithStore(
      <PermissionGate anyPermission={['alert:delete', 'alert:read']}>
        <span data-testid="protected">Visible</span>
      </PermissionGate>,
      'viewer',
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('anyPermission mode renders fallback when user has none', () => {
    renderWithStore(
      <PermissionGate anyPermission={['alert:delete', 'role:delete']} fallback={<span data-testid="denied">No</span>}>
        <span data-testid="protected">Visible</span>
      </PermissionGate>,
      'viewer',
    );
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });

  it('renders children when no permission requirement is set', () => {
    renderWithStore(
      <PermissionGate>
        <span data-testid="protected">Always visible</span>
      </PermissionGate>,
      'viewer',
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});
