export type ShareDto = {
  id: string;
  kind: 'USER' | 'PUBLIC_LINK';
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  recipientEmail: string | null;
  recipient: { id: string; name: string; email: string } | null;
  token: string | null;
  createdAt: string;
};

export type CreateShareRequest = {
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  resourceId: string;
  kind: 'USER' | 'PUBLIC_LINK';
  recipientEmail?: string;
};

export type PublicShareMetaDto = {
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  dataRoom: { id: string; name: string; ownerName: string } | null;
  folder?: { id: string; name: string };
  file?: { id: string; name: string; folderId: string };
  entryFolderId: string;
};

export type PublicContentsDto = {
  folder: {
    id: string;
    name: string;
  };
  folders: { id: string; name: string }[];
  files: { id: string; name: string; size: number; folderId: string }[];
  nextCursor: string | null;
  access: 'VIEWER';
};
