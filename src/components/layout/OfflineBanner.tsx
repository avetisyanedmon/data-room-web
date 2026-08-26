import { useEffect, useState } from 'react';
import { PiWifiSlashBold } from 'react-icons/pi';

/** Vault 13 — read-only degradation while the connection is down. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="alert" className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-6 py-2.5">
      <PiWifiSlashBold className="shrink-0 text-red-600" />
      <p className="text-[13px] text-red-800">
        <span className="font-semibold">You're offline.</span> Browsing continues from cache — uploads
        and changes are paused until the connection returns.
      </p>
    </div>
  );
}
