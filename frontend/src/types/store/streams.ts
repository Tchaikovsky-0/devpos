// =============================================================================
// Streams State Type - 视频流状态类型
// =============================================================================

import type { Stream, StreamStatus, StreamType, StreamLayout } from '../api/streams';

export interface StreamFilter {
  status?: StreamStatus;
  type?: StreamType;
}

export interface StreamState {
  streams: Stream[];
  selectedStream: Stream | null;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  filter: StreamFilter;
  layout: StreamLayout;
  playing: Record<string, boolean>;
}
