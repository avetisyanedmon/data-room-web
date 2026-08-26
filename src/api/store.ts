import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import '@/api/auth-api-ts/authApi';
import '@/api/data-room-api-ts/dataRoomApi';
import '@/api/share-api-ts/shareApi';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
