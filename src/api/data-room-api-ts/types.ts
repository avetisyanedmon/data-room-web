export type AccessRole = 'OWNER' | 'VIEWER';

export type UserSummaryDto = {
  id: string;
  email: string;
  name: string;
};

export type DataRoomDto = {
  id: string;
  name: string;
  owner: UserSummaryDto;
  itemCount: number;
  totalSize: string;
  createdAt: string;
  updatedAt: string;
  rootFolderId: string;
  entryFolderId: string;
  access: AccessRole;
};

export type FolderDto = {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
  path: string;
  itemCount: number;
  totalSize: string;
  createdAt: string;
  updatedAt: string;
};

export type FileDto = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataRoomId: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
};

export type BreadcrumbDto = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ContentsDto = {
  folder: FolderDto;
  breadcrumb: BreadcrumbDto[];
  folders: FolderDto[];
  files: FileDto[];
  nextCursor: string | null;
  access: AccessRole;
};

export type DataRoomListDto = {
  owned: DataRoomDto[];
  shared: SharedEntryDto[];
};

export type SharedEntryDto = {
  shareId: string;
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  dataRoom: DataRoomDto | { id: string; name: string; owner: UserSummaryDto };
  folder?: { id: string; name: string; dataRoomId: string };
  file?: { id: string; name: string; folderId: string; dataRoomId: string };
};

export type DeletePreviewDto = {
  folderId: string;
  folderName: string;
  folderCount: number;
  fileCount: number;
  totalSize: string;
  sampleNames: string[];
};

export type FilePreviewDto = {
  file: FileDto;
  url: string;
  expiresAt: string;
};

export type UploadResultDto = {
  files: FileDto[];
  errors: { name: string; message: string }[];
};

export type SearchResultDto = {
  folders: FolderDto[];
  files: FileDto[];
};

export type CreateDataRoomRequest = { name: string };
export type CreateFolderRequest = { name: string; parentId?: string };
export type RenameRequest = { name: string };
export type MoveFileRequest = { folderId: string };
