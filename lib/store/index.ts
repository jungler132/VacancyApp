import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import jobsReducer, { rememberJobs } from './jobsSlice';
import savedReducer, { hydrateSaved, persistSaved, toggleSaved } from './savedSlice';
import sourcesReducer, { hydrateSources, persistDisabledSources, toggleSource } from './sourcesSlice';

const listener = createListenerMiddleware();

listener.startListening({
  matcher: isAnyOf(toggleSaved, hydrateSaved.fulfilled),
  effect: async (action, listenerApi) => {
    const items = (listenerApi.getState() as { saved: { items: import('@/lib/types').Job[] } }).saved.items;
    listenerApi.dispatch(rememberJobs(items));
    if (toggleSaved.match(action)) {
      await persistSaved(items);
    }
  },
});

listener.startListening({
  actionCreator: toggleSource,
  effect: async (_action, listenerApi) => {
    const ids = (listenerApi.getState() as { sources: { disabledIds: string[] } }).sources.disabledIds;
    await persistDisabledSources(ids);
  },
});

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    saved: savedReducer,
    sources: sourcesReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg.signal', 'meta.abort'],
      },
    }).prepend(listener.middleware),
});

store.dispatch(hydrateSaved());
store.dispatch(hydrateSources());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
