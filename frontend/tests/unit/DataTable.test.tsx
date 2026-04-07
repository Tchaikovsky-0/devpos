import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DataTable, type Column } from '../../src/components/ui/DataTable';

interface TestRow {
  id: number;
  name: string;
  status: string;
  [key: string]: unknown;
}

describe('DataTable Component', () => {
  const mockColumns: Column<TestRow>[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'status', title: 'Status' },
  ];

  const mockData: TestRow[] = [
    { id: 1, name: 'Item 1', status: 'active' },
    { id: 2, name: 'Item 2', status: 'inactive' },
    { id: 3, name: 'Item 3', status: 'active' },
  ];

  it('should render table with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<DataTable columns={mockColumns} data={[]} />);
    
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('should handle row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable 
        columns={mockColumns} 
        data={mockData} 
        onRowClick={onRowClick} 
      />
    );

    fireEvent.click(screen.getByText('Item 1'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should render loading state', () => {
    const { container } = render(<DataTable columns={mockColumns} data={mockData} loading />);
    
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('should render with custom row key', () => {
    render(
      <DataTable 
        columns={mockColumns} 
        data={mockData} 
        rowKey="name" 
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should render action column', () => {
    const columns: Column<TestRow>[] = [
      ...mockColumns,
      {
        key: 'actions',
        title: 'Actions',
        render: (row: TestRow) => (
          <button data-testid={`edit-${row.id}`}>Edit</button>
        ),
      },
    ];

    render(<DataTable columns={columns} data={mockData} />);
    
    expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-2')).toBeInTheDocument();
    expect(screen.getByTestId('edit-3')).toBeInTheDocument();
  });

  it('should highlight selected row', () => {
    render(
      <DataTable 
        columns={mockColumns} 
        data={mockData} 
        selectedRows={new Set(['2'])}
        onSelectionChange={() => {}}
      />
    );

    const selectedRow = screen.getByText('Item 2').closest('tr');
    expect(selectedRow).toHaveClass('bg-accent/6');
  });
});
