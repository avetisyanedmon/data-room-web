import { api, type ApiData } from '../api';
import type {
  ContentsDto,
  CreateDataRoomRequest,
  CreateFolderRequest,
  DataRoomDto,
  DataRoomListDto,
  DeletePreviewDto,
  FileDto,
  FilePreviewDto,
  FolderDto,
  MoveFileRequest,
  RenameRequest,
  SearchResultDto,
  UploadResultDto,
} from './types';

export const dataRoomApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDataRooms: build.query<DataRoomListDto, void>({
      query: () => '/data-rooms',
      transformResponse: (response: ApiData<DataRoomListDto>) => response.data,
      providesTags: [{ type: 'DataRoom', id: 'LIST' }],
    }),
    getDataRoom: build.query<DataRoomDto, string>({
      query: (id) => `/data-rooms/${id}`,
      transformResponse: (response: ApiData<DataRoomDto>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'DataRoom', id }],
    }),
    createDataRoom: build.mutation<DataRoomDto, CreateDataRoomRequest>({
      query: (body) => ({ url: '/data-rooms', method: 'POST', body }),
      transformResponse: (response: ApiData<DataRoomDto>) => response.data,
      invalidatesTags: [{ type: 'DataRoom', id: 'LIST' }],
    }),
    renameDataRoom: build.mutation<DataRoomDto, { id: string; body: RenameRequest }>({
      query: ({ id, body }) => ({
        url: `/data-rooms/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiData<DataRoomDto>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DataRoom', id: 'LIST' },
        { type: 'DataRoom', id },
      ],
    }),
    deleteDataRoom: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/data-rooms/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiData<{ id: string }>) => response.data,
      invalidatesTags: [{ type: 'DataRoom', id: 'LIST' }],
    }),
    getContents: build.query<
      ContentsDto,
      { roomId: string; folderId?: string; cursor?: string; limit?: number }
    >({
      query: ({ roomId, folderId, cursor, limit }) => ({
        url: `/data-rooms/${roomId}/contents`,
        params: { folderId, cursor, limit },
      }),
      transformResponse: (response: ApiData<ContentsDto>) => response.data,
      providesTags: (_result, _error, { roomId, folderId }) => [
        { type: 'Contents', id: `${roomId}:${folderId ?? 'root'}` },
      ],
    }),
    searchContents: build.query<SearchResultDto, { roomId: string; q: string }>({
      query: ({ roomId, q }) => ({
        url: `/data-rooms/${roomId}/search`,
        params: { q },
      }),
      transformResponse: (response: ApiData<SearchResultDto>) => response.data,
    }),
    createFolder: build.mutation<
      FolderDto,
      { roomId: string; body: CreateFolderRequest }
    >({
      query: ({ roomId, body }) => ({
        url: `/data-rooms/${roomId}/folders`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiData<FolderDto>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    renameFolder: build.mutation<FolderDto, { id: string; body: RenameRequest }>({
      query: ({ id, body }) => ({
        url: `/folders/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiData<FolderDto>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    deleteFolderPreview: build.query<DeletePreviewDto, string>({
      query: (id) => `/folders/${id}/delete-preview`,
      transformResponse: (response: ApiData<DeletePreviewDto>) => response.data,
    }),
    deleteFolder: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/folders/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiData<{ id: string }>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    uploadFiles: build.mutation<
      UploadResultDto,
      { roomId: string; folderId?: string; files: File[] }
    >({
      query: ({ roomId, folderId, files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return {
          url: `/data-rooms/${roomId}/files`,
          method: 'POST',
          params: folderId ? { folderId } : undefined,
          body: formData,
        };
      },
      transformResponse: (response: ApiData<UploadResultDto>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    renameFile: build.mutation<FileDto, { id: string; body: RenameRequest }>({
      query: ({ id, body }) => ({
        url: `/files/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiData<FileDto>) => response.data,
      invalidatesTags: ['Contents'],
    }),
    moveFile: build.mutation<FileDto, { id: string; body: MoveFileRequest }>({
      query: ({ id, body }) => ({
        url: `/files/${id}/move`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiData<FileDto>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    deleteFile: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/files/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiData<{ id: string }>) => response.data,
      invalidatesTags: ['Contents', 'DataRoom'],
    }),
    previewFile: build.query<FilePreviewDto, string>({
      query: (id) => `/files/${id}`,
      transformResponse: (response: ApiData<FilePreviewDto>) => response.data,
    }),
  }),
});

export const {
  useGetDataRoomsQuery,
  useGetDataRoomQuery,
  useCreateDataRoomMutation,
  useRenameDataRoomMutation,
  useDeleteDataRoomMutation,
  useGetContentsQuery,
  useLazyGetContentsQuery,
  useSearchContentsQuery,
  useCreateFolderMutation,
  useRenameFolderMutation,
  useDeleteFolderPreviewQuery,
  useDeleteFolderMutation,
  useUploadFilesMutation,
  useRenameFileMutation,
  useMoveFileMutation,
  useDeleteFileMutation,
  usePreviewFileQuery,
  useLazyPreviewFileQuery,
} = dataRoomApi;
