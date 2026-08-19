import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ServiceMaster } from '@/lib/services/types';

export type ServicesCatalogState = {
  items: ServiceMaster[];
  ready: boolean;
};

const initialState: ServicesCatalogState = {
  items: [],
  ready: true,
};

const servicesCatalogSlice = createSlice({
  name: 'servicesCatalog',
  initialState,
  reducers: {
    setRemoteMasters(state, action: PayloadAction<ServiceMaster[]>) {
      state.items = action.payload;
    },
  },
});

export const { setRemoteMasters } = servicesCatalogSlice.actions;
export default servicesCatalogSlice.reducer;
