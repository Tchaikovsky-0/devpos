// =============================================================================
// DataTable - 数据表格组件
// =============================================================================

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface Column<T> {
  /** 列唯一标识 */
  key: string;
  /** 列标题 */
  title: string;
  /** 自定义渲染 */
  render?: (row: T, index: number) => React.ReactNode;
  /** 列宽度 */
  width?: string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否可排序 */
  sortable?: boolean;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface DataTableProps<T> {
  /** 列配置 */
  columns: Column<T>[];
  /** 数据源 */
  data: T[];
  /** 加载状态 */
  loading?: boolean;
  /** 空状态文本 */
  emptyText?: string;
  /** 空状态图标 */
  emptyIcon?: React.ReactNode;
  /** 分页配置 */
  pagination?: PaginationConfig;
  /** 行点击事件 */
  onRowClick?: (row: T) => void;
  /** 已选择行 ID 集合 */
  selectedRows?: Set<string>;
  /** 选择变更回调 */
  onSelectionChange?: (selected: Set<string>) => void;
  /** 行唯一标识字段 */
  rowKey?: keyof T;
  /** 表格类名 */
  className?: string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示表头 */
  showHeader?: boolean;
}

/**
 * 数据表格组件
 *
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *   { key: 'name', title: '姓名', sortable: true },
 *   { key: 'email', title: '邮箱' },
 *   { key: 'status', title: '状态', render: (row) => <Badge>{row.status}</Badge> },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   pagination={{ page, pageSize, total, onPageChange }}
 *   onRowClick={(row) => navigate(`/users/${row.id}`)}
 * />
 * ```
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  emptyIcon,
  pagination,
  onRowClick,
  selectedRows,
  onSelectionChange,
  rowKey = 'id' as keyof T,
  className,
  bordered = true,
  showHeader = true,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 排序后的数据
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // 处理排序
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedRows?.size === data.length && data.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(row => String(row[rowKey]))));
    }
  };

  // 选择行
  const handleSelectRow = (id: string) => {
    if (!onSelectionChange || !selectedRows) return;
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  // 渲染排序图标
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortColumn !== column.key) {
      return <ArrowUpDown className="w-4 h-4 text-text-tertiary" />;
    }

    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-accent" />
    ) : (
      <ArrowDown className="w-4 h-4 text-accent" />
    );
  };

  // 渲染分页
  const renderPagination = () => {
    if (!pagination) return null;

    const { page, pageSize, total, onPageChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return (
      <div className="flex items-center justify-between border-t border-border bg-bg-surface/55 px-4 py-3">
        <div className="text-sm text-text-secondary">
          显示 {total === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}，共 {total} 条
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-text-primary px-2 min-w-[80px] text-center">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={page === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // 渲染加载状态
  const renderLoading = () => (
    <>
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 animate-shimmer rounded-full bg-bg-hover" />
        </td>
      ))}
    </>
  );

  // 渲染空状态
  const renderEmpty = () => (
    <tr>
      <td
        colSpan={columns.length + (onSelectionChange ? 1 : 0)}
        className="px-4 py-12 text-center"
      >
        <div className="flex flex-col items-center justify-center">
          {emptyIcon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface text-text-tertiary">
              {emptyIcon}
            </div>
          )}
          <p className="text-text-tertiary">{emptyText}</p>
        </div>
      </td>
    </tr>
  );

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px]',
        bordered ? 'surface-panel' : 'bg-transparent',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-bg-base/70">
              <tr>
                {onSelectionChange && (
                  <th className="w-10 border-b border-border px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows?.size === data.length && data.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-border bg-transparent text-accent focus:ring-accent"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary',
                      col.sortable && 'cursor-pointer select-none hover:text-text-primary'
                    )}
                    style={{ width: col.width }}
                    onClick={() => handleSort(col)}
                  >
                    <div className={cn('flex items-center gap-1', col.align === 'center' && 'justify-center', col.align === 'right' && 'justify-end')}>
                      <span>{col.title}</span>
                      {renderSortIcon(col)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border/70">
                  {renderLoading()}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              renderEmpty()
            ) : (
              sortedData.map((row, rowIndex) => {
                const rowId = String(row[rowKey]);
                const isSelected = selectedRows?.has(rowId);

                return (
                  <tr
                    key={rowId || rowIndex}
                    className={cn(
                      'border-t border-border/70 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-bg-surface/80',
                      isSelected && 'bg-accent/6'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectionChange && (
                      <td className="w-10 px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="h-4 w-4 rounded border-border bg-transparent text-accent focus:ring-accent"
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm text-text-primary',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right'
                        )}
                      >
                        {col.render ? col.render(row, rowIndex) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}
