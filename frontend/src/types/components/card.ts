// =============================================================================
// Component Types - 组件 Props 类型定义
// =============================================================================

import type { ReactNode, HTMLAttributes } from 'react';

// Card Props
export type CardVariant = 'default' | 'glass' | 'accent' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  animated?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'sm' | 'md' | 'lg';
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

// Button Props
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

// Input Props
export type InputVariant = 'default' | 'filled' | 'outline' | 'glass';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<HTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

// DataCard Props
export type DataCardVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface DataCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  variant?: DataCardVariant;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
}

// Panel Props
export type PanelVariant = 'default' | 'bordered' | 'filled';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  header?: ReactNode;
}

// Badge Props
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// StatusIndicator Props
export type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'pending';

export interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
}

// EmptyState Props
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Skeleton Props
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}
