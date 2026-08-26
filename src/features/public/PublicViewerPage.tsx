import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePreviewPublicFileQuery } from '@/api/share-api-ts/shareApi';
import { Spinner } from '@/components/ui/Spinner';
import { formatBytes } from '@/lib/format';
import { saveObjectUrl } from '@/lib/file-transfer';
import { PdfFrame } from '@/features/viewer/PdfFrame';
import { ViewerChrome } from '@/features/viewer/ViewerChrome';
import { RevokedPage } from './RevokedPage';

/** Vault 08 — the same viewer against the unauthenticated public endpoints. */
export function PublicViewerPage() {
  const { token = '', fileId = '' } = useParams();
  const navigate = useNavigate();
  const urlRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const { data, isLoading, error } = usePreviewPublicFileQuery(
    { token, fileId },
    { skip: !token || !fileId },
  );

  const onUrlReady = useCallback((url: string | null) => {
    urlRef.current = url;
    setReady(Boolean(url));
  }, []);

  if (error) {
    return (
      <RevokedPage
        title="This document is no longer shared"
        description="The link was revoked, or the document was removed from the data room."
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-svh items-center justify-center bg-vault-900 text-white/60">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <ViewerChrome
      name={data.file.name}
      subtitle={`${formatBytes(data.file.size)} · shared document`}
      readOnly
      onBack={() => navigate(`/share/${token}`)}
      downloading={!ready}
      onDownload={() => {
        if (!urlRef.current) {
          toast.error('The document is still loading');
          return;
        }
        saveObjectUrl(urlRef.current, data.file.name);
      }}
    >
      <PdfFrame
        path={`/public/${token}/files/${fileId}/content`}
        name={data.file.name}
        authenticated={false}
        onUrlReady={onUrlReady}
      />
    </ViewerChrome>
  );
}
