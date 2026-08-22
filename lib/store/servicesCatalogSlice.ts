import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ServiceMaster } from '@/lib/services/types';

export type ServicesCatalogState = {
  items: ServiceMaster[];
  ready: boolean;
};

const initialState: ServicesCatalogState = {
  items: [],
  ready: false,
};

const servicesCatalogSlice = createSlice({
  name: 'servicesCatalog',
  initialState,
  reducers: {
    setRemoteMasters(state, action: PayloadAction<ServiceMaster[]>) {
      state.items = action.payload;
      state.ready = true;
    },
    settleCatalog(state) {
      state.ready = true;
    },
  },
});

export const { setRemoteMasters, settleCatalog } = servicesCatalogSlice.actions;
export default servicesCatalogSlice.reducer;
