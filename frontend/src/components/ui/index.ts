/**
 * UI 组件库 - Tech-Industrial Minimalism 设计系统
 * 
 * 新组件 (玻璃拟态系列) + 保留组件 (兼容旧代码)
 */

// ── 新设计系统组件 (玻璃拟态) ──
export { default as GlassCard } from './GlassCard';
export type { GlassCardProps } from './GlassCard';

export { default as GlassButton } from './GlassButton';
export type { GlassButtonProps } from './GlassButton';

export { default as IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { default as CommandBar } from './CommandBar';
export type { CommandBarProps, CommandItem } from './CommandBar';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeStatus } from './Badge';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// ── 保留组件 (cva + Radix 风格) ──
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
// Card types are not individually exported from Card.tsx

export { Input, SearchInput, TextArea } from './Input';
export type { InputProps, TextAreaProps } from './Input';

export { DataTable } from './DataTable';
export type { Column, PaginationConfig, DataTableProps } from './DataTable';

export { Panel } from './Panel';
export type { PanelProps } from './Panel';

export { DataCard } from './DataCard';
export type { DataCardProps } from './DataCard';

export { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';
export type { LoadingSpinnerProps, LoadingOverlayProps } from './LoadingSpinner';

export { Skeleton, SkeletonCard, SkeletonDataCard } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { VirtualList } from './VirtualList';

export { StatusBadge, statusBadgeVariants } from './StatusBadge';
export type { StatusBadgeProps, StatusVariant } from './StatusBadge';

export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps } from './StatusIndicator';

export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { AlertBadge } from './AlertBadge';
export type { AlertBadgeProps } from './AlertBadge';

export {
  Spinner,
  FullscreenLoader,
  PageContentLoader,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  Skeleton as PageLoaderSkeleton,
  ProgressBar,
  LoadingWithText,
  InlineLoader,
  ButtonLoader,
} from './PageLoader';

export {
  AdvancedFilter,
} from './AdvancedFilter';

export {
  BatchToolbar,
} from './BatchToolbar';

export {
  FilterPill,
} from './FilterPill';

export {
  ShortcutHint,
} from './ShortcutHint';

export {
  ShortcutPalette,
} from './ShortcutPalette';

// ── shadcn/ui 组件 (Radix) ──
export { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from './alert-dialog';

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from './dialog';

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './dropdown-menu';

export { ScrollArea } from './scroll-area';

export { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction } from './toast';
export { useToast, toast } from './use-toast';
