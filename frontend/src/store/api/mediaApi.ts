// =============================================================================
// Media API Slice - 媒体库 API
// =============================================================================

import { baseApi } from './baseApi';

// =============================================================================
// Types
// =============================================================================

export interface MediaItem {
  id: number;
  time: string;
  date: string;
  alt: number;
  lat: number;
  lng: number;
  tag: string;
  starred: boolean;
  image: string;
  imageFull: string;
}

export interface MediaListParams {
  page?: number;
  page_size?: number;
}

export interface MediaListResponse {
  data: MediaItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface MediaStatistics {
  total: number;
  starred: number;
  trash: number;
  tags: string[];
}

// =============================================================================
// Mock data (until backend media API is ready)
// =============================================================================

const DRONE_SQUARE_THUMB_QS = 'w=560&h=560&fit=crop&auto=format&q=80';
const DRONE_FULL_QS = 'w=1920&h=1280&fit=crop&auto=format&q=82';

const droneImageIds = [
  'photo-1507619579562-f2e10da1ec86',
  'photo-1497435334941-8c899ee9e8e9',
  'photo-1530044426743-4b7125613d93',
  'photo-1506624183912-c602f4a21ca7',
  'photo-1564450361329-c045112726b2',
  'photo-1633792892356-cc6ba577dd9e',
  'photo-1715199399795-73deba5bee63',
  'photo-1678872590530-181ff9b5db92',
  'photo-1640108641535-d8ed7f1071f1',
  'photo-1719176006159-a86dd4c84696',
  'photo-1713342902715-6248e4409a8f',
  'photo-1652044812681-cbddd059fdc1',
] as const;

const droneSquareThumb = (id: string): string =>
  `https://images.unsplash.com/${id}?${DRONE_SQUARE_THUMB_QS}`;

const droneFull = (id: string): string =>
  `https://images.unsplash.com/${id}?${DRONE_FULL_QS}`;

function generateMockPhotos(page: number, pageSize: number, offset: number): MediaItem[] {
  return Array.from({ length: pageSize }, (_, index) => {
    const imageId = droneImageIds[(offset + index) % droneImageIds.length];
    return {
      id: offset + index + 1,
      time: `14:${(30 + (offset + index) * 2).toString().padStart(2, '0')}:${((10 + (offset + index) * 5) % 60).toString().padStart(2, '0')}`,
      date: '2026-03-23',
      alt: 60 + Math.round(Math.random() * 100),
      lat: 31.2397 + (Math.random() - 0.5) * 0.01,
      lng: 121.4998 + (Math.random() - 0.5) * 0.01,
      tag: ['巡检', '监测', '测绘', '搜救'][(offset + index) % 4],
      starred: false,
      image: droneSquareThumb(imageId),
      imageFull: droneFull(imageId),
    };
  });
}

// =============================================================================
// API Slice
// =============================================================================

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * 获取媒体文件列表（分页）
     * TODO: 当后端 media API 就绪后，替换 queryFn 为 query
     */
    listMedia: builder.query<MediaListResponse, MediaListParams | undefined>({
      queryFn: (params) => {
        const page = params?.page ?? 1;
        const pageSize = params?.page_size ?? 12;
        const offset = (page - 1) * pageSize;

        // Simulate a total of 96 photos across 8 pages
        const total = 96;
        const remaining = total - offset;
        const count = Math.min(pageSize, remaining);

        if (count <= 0) {
          return { data: { data: [], total, page, page_size: pageSize } };
        }

        const data = generateMockPhotos(page, count, offset);
        return { data: { data, total, page, page_size: pageSize } };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Media' as const, id })),
              { type: 'Media' as const, id: 'LIST' },
            ]
          : [{ type: 'Media' as const, id: 'LIST' }],
    }),

    /**
     * 获取媒体统计信息
     * TODO: 当后端 media API 就绪后，替换 queryFn 为 query
     */
    getMediaStatistics: builder.query<MediaStatistics, void>({
      queryFn: () => {
        return {
          data: {
            total: 96,
            starred: 0,
            trash: 0,
            tags: ['巡检', '监测', '测绘', '搜救'],
          },
        };
      },
      providesTags: ['MediaStatistics'],
    }),
  }),
});

export const { useListMediaQuery, useGetMediaStatisticsQuery } = mediaApi;
