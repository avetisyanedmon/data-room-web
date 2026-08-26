import {
  PiArrowClockwiseBold,
  PiCheckCircleFill,
  PiFilePdfFill,
  PiWarningCircleFill,
  PiXBold,
} from 'react-icons/pi';
import { IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { QueueItem } from './types';

const STATUS_LABEL: Record<QueueItem['status'], string> = {
  waiting: 'Waiting',
  uploading: 'Uploading',
  done: 'Done',
  failed: 'Failed',
  canceled: 'Canceled',
};

export function UploadRow({
  item,
  onCancel,
  onRetry,
  onDismiss,
}: {
  item: QueueItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const settled = item.status === 'done' || item.status === 'failed' || item.status === 'canceled';
  const failed = item.status === 'failed';

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors',
        item.status === 'waiting' && 'opacity-60',
        failed && 'bg-red-50/40',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border',
          failed || item.status === 'canceled'
            ? 'border-vault-200 bg-vault-50 text-vault-400'
            : 'border-red-100 bg-red-50 text-red-500',
        )}
      >
        <PiFilePdfFill className="text-lg" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={cn(
              'truncate text-[13px] font-semibold text-vault-900',
              item.status === 'canceled' && 'text-vault-400 line-through',
            )}
            title={item.name}
          >
            {item.serverName ?? item.name}
          </p>
          <span
            className={cn(
              'shrink-0 text-[11px] font-bold tracking-wide uppercase',
              item.status === 'done' && 'text-emerald-600',
              failed && 'text-red-600',
              item.status === 'uploading' && 'text-accent',
              (item.status === 'waiting' || item.status === 'canceled') && 'text-vault-400',
            )}
          >
            {item.status === 'done' ? (
              <span className="inline-flex items-center gap-1">
                <PiCheckCircleFill /> Done
              </span>
            ) : item.status === 'uploading' ? (
              `${item.progress}%`
            ) : (
              STATUS_LABEL[item.status]
            )}
          </span>
        </div>

        <p className="tabular mt-0.5 text-[11px] text-vault-500">
          {formatBytes(item.size)}
          {item.serverName && item.serverName !== item.name ? (
            <span className="text-amber-700"> · renamed from {item.name}</span>
          ) : null}
        </p>

        {failed ? (
          <p className="mt-1 flex items-start gap-1.5 text-[11px] font-medium text-red-600">
            <PiWarningCircleFill className="mt-0.5 shrink-0" />
            {item.error}
          </p>
        ) : null}

        {item.status === 'uploading' || item.status === 'waiting' ? (
          <ProgressBar
            className="mt-2 h-1"
            value={item.progress}
            striped={item.status === 'uploading'}
            label={`Uploading ${item.name}`}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {failed ? (
          <IconButton label={`Retry ${item.name}`} onClick={() => onRetry(item.id)}>
            <PiArrowClockwiseBold className="text-sm" />
          </IconButton>
        ) : null}
        {settled ? (
          <IconButton label={`Dismiss ${item.name}`} onClick={() => onDismiss(item.id)}>
            <PiXBold className="text-xs" />
          </IconButton>
        ) : (
          <IconButton label={`Cancel ${item.name}`} onClick={() => onCancel(item.id)}>
            <PiXBold className="text-xs" />
          </IconButton>
        )}
      </div>
    </li>
  );
}
