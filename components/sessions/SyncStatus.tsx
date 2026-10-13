import type { Snapshot } from '@/lib/sessions/store';

/** Honest save state: never says "synced" for a write that failed. */
export function SyncStatus({ snapshot, onRetry, guest }: { snapshot: Snapshot; onRetry: () => void; guest: boolean }) {
  let text: string;
  if (guest || snapshot.status === 'local') text = 'Saved on this device. Sign in to keep your sessions on your account.';
  else if (snapshot.status === 'syncing') text = 'Syncing with your account…';
  else if (snapshot.status === 'failed') text = `Saved on this device. Not synced yet${snapshot.error ? `: ${snapshot.error}` : ''}`;
  else if (snapshot.status === 'pending') text = `Saved on this device · ${snapshot.pending} ${snapshot.pending === 1 ? 'change' : 'changes'} waiting to sync`;
  else text = 'Saved to your account';
  return <div className="flex flex-wrap items-center gap-2 text-xs text-muted" role="status" data-testid="sync-status" data-state={snapshot.status}>
    <span>{text}</span>
    {!guest && (snapshot.status === 'failed' || snapshot.status === 'pending') && <button type="button" onClick={onRetry} className="font-semibold text-accent underline">Retry sync</button>}
    {!snapshot.storageOk && <span className="font-semibold text-accent">Device storage is blocked: keep this page open, progress may not survive a refresh.</span>}
  </div>;
}
