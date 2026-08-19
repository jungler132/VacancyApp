import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SEED_MASTERS } from '@/lib/services/seed';
import type { ServiceMaster } from '@/lib/services/types';

export type ServicesCatalogState = {
  items: ServiceMaster[];
  ready: boolean;
};

const initialState: ServicesCatalogState = {
  items: SEED_MASTERS,
  ready: true,
};

const servicesCatalogSlice = createSlice({
  name: 'servicesCatalog',
  initialState,
  reducers: {
    setRemoteMasters(state, action: PayloadAction<ServiceMaster[]>) {
      state.items = action.payload.length ? action.payload : SEED_MASTERS;
    },
  },
});

export const { setRemoteMasters } = servicesCatalogSlice.actions;
export default servicesCatalogSlice.reducer;
