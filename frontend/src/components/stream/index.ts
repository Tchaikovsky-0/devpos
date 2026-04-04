// Re-export with explicit names to avoid naming conflicts
// VideoStreamPlayer exports StreamStatus
export { VideoStreamPlayer, type StreamStatus } from './VideoStreamPlayer';

// StreamGrid exports LayoutType and StreamItem
export { StreamGrid, type LayoutType, type StreamItem } from './StreamGrid';

// StreamList exports StreamDevice and StreamStatus (aliased to avoid conflict)
export { StreamList, type StreamDevice } from './StreamList';
export type { StreamStatus as StreamListStatus } from './StreamList';

// LayoutSwitcher exports LayoutType (aliased to avoid conflict with StreamGrid)
export { LayoutSwitcher } from './LayoutSwitcher';
export type { LayoutType as LayoutSwitcherLayoutType } from './LayoutSwitcher';
