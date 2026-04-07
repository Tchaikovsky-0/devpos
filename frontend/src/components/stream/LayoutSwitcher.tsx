import React, { memo } from 'react';
import { Grid, LayoutGrid, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LayoutType = '1x1' | '2x2' | '3x3' | '4x4' | 'auto';

interface LayoutOption {
  type: LayoutType;
  label: string;
  icon: React.ReactNode;
}

const layoutOptions: LayoutOption[] = [
  { type: '1x1', label: '聚焦', icon: <Square className="h-4 w-4" /> },
  { type: '2x2', label: '四格', icon: <Grid className="h-4 w-4" /> },
  { type: '3x3', label: '九格', icon: <LayoutGrid className="h-4 w-4" /> },
  { type: '4x4', label: '十六格', icon: <LayoutGrid className="h-4 w-4" /> },
  { type: 'auto', label: '自适应', icon: <LayoutGrid className="h-4 w-4" /> },
];

interface LayoutSwitcherProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  className?: string;
}

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = memo(
  ({ layout, onLayoutChange, className }) => (
    <div className={cn('inline-flex rounded-full border border-border bg-bg-surface p-1', className)}>
      {layoutOptions.map((option) => (
        <button
          key={option.type}
          type="button"
          onClick={() => onLayoutChange(option.type)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
            layout === option.type
              ? 'bg-accent text-white shadow-panel'
              : 'text-text-secondary hover:text-text-primary',
          )}
          title={option.label}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  ),
);

LayoutSwitcher.displayName = 'LayoutSwitcher';

export default LayoutSwitcher;
