import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PiLinkBreakBold } from 'react-icons/pi';
import { usePreviewFileQuery } from '@/api/data-room-api-ts/dataRoomApi';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { isForbidden, isGoneOrDenied } from '@/lib/errors';
import { formatBytes, formatRelative } from '@/lib/format';
import { saveObjectUrl } from '@/lib/file-transfer';
import { PdfFrame } from './PdfFrame';
import { ViewerChrome } from './ViewerChrome';
import { WrongAccountPage } from '@/features/public/WrongAccountPage';

export function ViewerPage() {
  const { roomId = '', fileId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const urlRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const { data, isLoading, error } = usePreviewFileQuery(fileId, { skip: !fileId });

  const onUrlReady = useCallback((url: string | null) => {
    urlRef.current = url;
    setReady(Boolean(url));
  }, []);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/rooms/${roomId}`);
  };

  if (error && isForbidden(error)) {
    return (
      <div className="flex min-h-svh">
        <WrongAccountPage returnTo={location.pathname} />
      </div>
    );
  }

  if (error && isGoneOrDenied(error)) {
    return (
      <div className="flex h-svh items-center justify-center bg-vault-50 p-6">
        <EmptyState
          icon={<PiLinkBreakBold />}
          title="This document is no longer available"
          description="It was deleted or un-shared while you were viewing it."
          actions={<Button onClick={() => navigate(`/rooms/${roomId}`)}>Back to the data room</Button>}
        />
      </div>
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
      subtitle={`${formatBytes(data.file.size)} · updated ${formatRelative(data.file.updatedAt)}`}
      onBack={goBack}
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
        path={`/files/${fileId}/content`}
        name={data.file.name}
        authenticated
        onUrlReady={onUrlReady}
      />
    </ViewerChrome>
  );
}
