import { api, type ApiData } from '../api';
import type {
  CreateShareRequest,
  PublicContentsDto,
  PublicShareMetaDto,
  ShareDto,
} from './types';
import type { FilePreviewDto } from '../data-room-api-ts/types';

export const shareApi = api.injectEndpoints({
  endpoints: (build) => ({
    getShares: build.query<
      ShareDto[],
      { resourceType: string; resourceId: string }
    >({
      query: ({ resourceType, resourceId }) => ({
        url: '/shares',
        params: { resourceType, resourceId },
      }),
      transformResponse: (response: ApiData<ShareDto[]>) => response.data,
      providesTags: ['Share'],
    }),
    createShare: build.mutation<ShareDto, CreateShareRequest>({
      query: (body) => ({ url: '/shares', method: 'POST', body }),
      transformResponse: (response: ApiData<ShareDto>) => response.data,
      invalidatesTags: ['Share'],
    }),
    revokeShare: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/shares/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiData<{ id: string }>) => response.data,
      invalidatesTags: ['Share'],
    }),
    getPublicShare: build.query<PublicShareMetaDto, string>({
      query: (token) => `/public/${token}`,
      transformResponse: (response: ApiData<PublicShareMetaDto>) => response.data,
    }),
    getPublicContents: build.query<
      PublicContentsDto,
      { token: string; folderId?: string; cursor?: string }
    >({
      query: ({ token, folderId, cursor }) => ({
        url: `/public/${token}/contents`,
        params: { folderId, cursor },
      }),
      transformResponse: (response: ApiData<PublicContentsDto>) => response.data,
    }),
    previewPublicFile: build.query<
      FilePreviewDto,
      { token: string; fileId: string }
    >({
      query: ({ token, fileId }) => `/public/${token}/files/${fileId}`,
      transformResponse: (response: ApiData<FilePreviewDto>) => response.data,
    }),
  }),
});

export const {
  useGetSharesQuery,
  useCreateShareMutation,
  useRevokeShareMutation,
  useGetPublicShareQuery,
  useGetPublicContentsQuery,
  useLazyGetPublicContentsQuery,
  usePreviewPublicFileQuery,
  useLazyPreviewPublicFileQuery,
} = shareApi;
