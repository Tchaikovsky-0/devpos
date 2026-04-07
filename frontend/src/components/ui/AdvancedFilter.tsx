// AdvancedFilter - 高级筛选组件
// 支持多条件组合、预设模板、保存筛选条件

import { useState, useCallback } from 'react';
import { Search, Filter, X, Save } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import Badge from './Badge';
import { cn } from '@/lib/utils';

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'between';
  value: string | number | string[] | [number, number];
  label?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  createdAt: string;
}

interface AdvancedFilterProps {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'number' | 'date' | 'dateRange';
    options?: Array<{ value: string; label: string }>;
  }>;
  onFilter: (conditions: FilterCondition[]) => void;
  onSave?: (name: string, conditions: FilterCondition[]) => void;
  savedFilters?: SavedFilter[];
  className?: string;
  initialConditions?: FilterCondition[];
}

export function AdvancedFilter({
  fields,
  onFilter,
  onSave,
  savedFilters = [],
  className,
  initialConditions = [],
}: AdvancedFilterProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(initialConditions);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const operators = [
    { value: 'eq', label: '等于' },
    { value: 'ne', label: '不等于' },
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'gte', label: '大于等于' },
    { value: 'lte', label: '小于等于' },
    { value: 'contains', label: '包含' },
    { value: 'in', label: '在...中' },
    { value: 'between', label: '介于' },
  ];

  const addCondition = useCallback(() => {
    setConditions((prev) => [
      ...prev,
      {
        field: fields[0]?.key || '',
        operator: 'eq',
        value: '',
      },
    ]);
  }, [fields]);

  const removeCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCondition = useCallback((index: number, updates: Partial<FilterCondition>) => {
    setConditions((prev) =>
      prev.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    );
  }, []);

  const applyFilter = useCallback(() => {
    onFilter(conditions);
  }, [conditions, onFilter]);

  const clearAll = useCallback(() => {
    setConditions([]);
    onFilter([]);
  }, [onFilter]);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    if (!value) {
      onFilter(conditions);
    }
  }, [conditions, onFilter]);

  const quickSearch = useCallback(() => {
    if (searchValue) {
      const searchConditions = fields.map((field) => ({
        field: field.key,
        operator: 'contains' as const,
        value: searchValue,
      }));
      onFilter(searchConditions);
    }
  }, [searchValue, fields, onFilter]);

  const loadSavedFilter = useCallback((saved: SavedFilter) => {
    setConditions(saved.conditions);
    onFilter(saved.conditions);
  }, [onFilter]);

  const activeConditionCount = conditions.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickSearch()}
            placeholder="搜索..."
            className="pl-10"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选
          {activeConditionCount > 0 && (
            <Badge variant="info">
              {activeConditionCount}
            </Badge>
          )}
        </Button>

        {savedFilters.length > 0 && (
          <select
            onChange={(e) => {
              const saved = savedFilters.find((f) => f.id === e.target.value);
              if (saved) loadSavedFilter(saved);
            }}
            className="px-3 py-2 rounded-lg border bg-bg-surface text-sm"
          >
            <option value="">选择预设</option>
            {savedFilters.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}

        <Button variant="ghost" size="sm" onClick={applyFilter}>
          应用
        </Button>
      </div>

      {/* 高级筛选面板 */}
      {isExpanded && (
        <div className="p-4 rounded-lg border bg-bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">筛选条件</h3>
            <div className="flex gap-2">
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const name = prompt('请输入筛选条件名称：');
                    if (name) onSave(name, conditions);
                  }}
                  className="gap-1"
                >
                  <Save className="h-3 w-3" />
                  保存
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                清除全部
              </Button>
            </div>
          </div>

          {/* 条件列表 */}
          <div className="space-y-2">
            {conditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-start">
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  className="px-3 py-2 rounded-lg border bg-bg-elevated text-sm min-w-[120px]"
                >
                  {fields.map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, {
                      operator: e.target.value as FilterCondition['operator'],
                    })
                  }
                  className="px-3 py-2 rounded-lg border bg-bg-elevated text-sm min-w-[100px]"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                <Input
                  value={String(condition.value)}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="值"
                  className="flex-1"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="text-text-tertiary hover:text-error"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addCondition}>
            + 添加条件
          </Button>
        </div>
      )}

      {/* 活跃筛选标签 */}
      {activeConditionCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {conditions.map((condition, index) => {
            const field = fields.find((f) => f.key === condition.field);
            const operator = operators.find((op) => op.value === condition.operator);
            return (
              <Badge
                key={index}
                variant="default"
                className="gap-1 pr-1"
              >
                <span>{field?.label}</span>
                <span className="text-text-tertiary">{operator?.label}</span>
                <span>{String(condition.value)}</span>
                <button
                  onClick={() => removeCondition(index)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdvancedFilter;
