import { api, type ApiData } from '../api';
import type { AuthSessionDto, LoginRequest, RegisterRequest, UserDto } from './types';
import { setAuthToken } from '@/lib/auth-storage';

/**
 * Persists the session token once the request settles.
 *
 * The rejection has to be swallowed here: the calling component already
 * surfaces the failure through `unwrap()`, and leaving `queryFulfilled`
 * unhandled raises an "Uncaught (in promise)" rejection on every failed
 * sign-in — which the Vite dev overlay throws over the whole page.
 */
async function persistSessionToken(queryFulfilled: Promise<{ data: AuthSessionDto }>) {
  try {
    const { data } = await queryFulfilled;
    setAuthToken(data.token);
  } catch {
    /* credentials rejected — nothing to persist */
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthSessionDto, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiData<AuthSessionDto>) => response.data,
      onQueryStarted: (_arg, { queryFulfilled }) => persistSessionToken(queryFulfilled),
      invalidatesTags: ['Auth'],
    }),
    register: build.mutation<AuthSessionDto, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiData<AuthSessionDto>) => response.data,
      onQueryStarted: (_arg, { queryFulfilled }) => persistSessionToken(queryFulfilled),
      invalidatesTags: ['Auth'],
    }),
    me: build.query<UserDto, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiData<UserDto>) => response.data,
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi;
