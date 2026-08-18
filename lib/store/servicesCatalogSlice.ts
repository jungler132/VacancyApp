import { createSlice } from '@reduxjs/toolkit';

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
  reducers: {},
});

export default servicesCatalogSlice.reducer;
