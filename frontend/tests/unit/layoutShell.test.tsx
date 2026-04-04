import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { store } from '../../src/store';
import { Layout } from '../../src/components/Layout';
import { ThemeToggle } from '../../src/components/ThemeToggle';

describe('Shell Layout', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    window.localStorage.clear();
  });

  it('toggles the document theme between dark and light', async () => {
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: '切换到浅色模式' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('renders the contextual navigation for the active module group', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Layout />,
          children: [
            { path: '', element: <div>Dashboard View</div> },
            { path: 'alerts', element: <div>Alerts View</div> },
            { path: 'monitor', element: <div>Monitor View</div> },
            { path: 'tasks', element: <div>Tasks View</div> },
            { path: 'sensors', element: <div>Sensors View</div> },
          ],
        },
      ],
      { initialEntries: ['/alerts'] },
    );

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0);
    expect(screen.getByText('告警中心')).toBeInTheDocument();
    expect(screen.getByText('实时监控')).toBeInTheDocument();
    expect(screen.getByText('任务管理')).toBeInTheDocument();
    expect(screen.getByText('传感器')).toBeInTheDocument();
  });
});
