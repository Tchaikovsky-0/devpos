import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { streamAPI, Stream } from '../api/v1/streams';

interface StreamState {
  streams: Stream[];
  selectedStream: Stream | null;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  filter: {
    status?: string;
    type?: string;
  };
  layout: '1x1' | '2x2' | '3x3' | '4x4';
  playing: Record<string, boolean>;
}

const initialState: StreamState = {
  streams: [],
  selectedStream: null,
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  filter: {},
  layout: '2x2',
  playing: {},
};

export const fetchStreams = createAsyncThunk(
  'streams/fetchStreams',
  async (params?: { page?: number; filter?: StreamState['filter'] }) => {
    const response = await streamAPI.list({
      page: params?.page,
      page_size: 50,
      ...params?.filter,
    });
    return response.data;
  }
);

const streamSlice = createSlice({
  name: 'streams',
  initialState,
  reducers: {
    setSelectedStream: (state, action: PayloadAction<Stream | null>) => {
      state.selectedStream = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setFilter: (state, action: PayloadAction<StreamState['filter']>) => {
      state.filter = action.payload;
      state.page = 1;
    },
    setLayout: (state, action: PayloadAction<StreamState['layout']>) => {
      state.layout = action.payload;
    },
    togglePlaying: (state, action: PayloadAction<string>) => {
      state.playing[action.payload] = !state.playing[action.payload];
    },
    addStream: (state, action: PayloadAction<Stream>) => {
      state.streams.push(action.payload);
      state.total += 1;
    },
    updateStream: (state, action: PayloadAction<Stream>) => {
      const index = state.streams.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.streams[index] = action.payload;
      }
    },
    removeStream: (state, action: PayloadAction<string>) => {
      state.streams = state.streams.filter(s => s.id !== action.payload);
      state.total -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStreams.fulfilled, (state, action) => {
        state.loading = false;
        state.streams = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchStreams.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setSelectedStream,
  setPage,
  setFilter,
  setLayout,
  togglePlaying,
  addStream,
  updateStream,
  removeStream,
} = streamSlice.actions;

export default streamSlice.reducer;
