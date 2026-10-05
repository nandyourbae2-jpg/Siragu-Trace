import { useState, useEffect, useCallback } from 'react';

type SyncStatus = 'SYNCED' | 'SYNCING' | 'OFFLINE';
type QueueItem<T> = { id: string; payload: T; timestamp: number };

export function useOfflineSync<T>(
  queueKey: string,
  syncFn: (payload: T) => Promise<void>
) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'SYNCED' : 'OFFLINE');
  const [queue, setQueue] = useState<QueueItem<T>[]>([]);

  // Load initial queue
  useEffect(() => {
    const saved = localStorage.getItem(`offline_queue_${queueKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQueue(parsed);
        if (parsed.length > 0 && navigator.onLine) {
          setStatus('SYNCING');
        } else if (parsed.length > 0) {
          setStatus('OFFLINE');
        }
      } catch (e) {
        console.error('Failed to parse offline queue', e);
      }
    }
  }, [queueKey]);

  // Save queue on change
  useEffect(() => {
    localStorage.setItem(`offline_queue_${queueKey}`, JSON.stringify(queue));
  }, [queue, queueKey]);

  // Sync logic
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || !navigator.onLine) return;
    setStatus('SYNCING');

    const newQueue = [...queue];
    for (let i = 0; i < newQueue.length; i++) {
      try {
        await syncFn(newQueue[i].payload);
        newQueue.splice(i, 1);
        i--; // Adjust index after removal
      } catch (error: unknown) {
        const err = error as { response?: { status: number } };
        // If it's a 4xx error (validation, conflict), we might need to drop or mark it failed.
        // For now, we'll keep it in the queue unless it's a 4xx.
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
           console.error('Validation error syncing draft, removing from queue', newQueue[i]);
           newQueue.splice(i, 1);
           i--;
        } else {
           console.error('Network error syncing, stopping sync queue');
           break; // Stop syncing on network error
        }
      }
    }

    setQueue([...newQueue]);
    setStatus(newQueue.length === 0 ? 'SYNCED' : navigator.onLine ? 'SYNCING' : 'OFFLINE');
  }, [queue, syncFn]);

  // Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (queue.length > 0) {
        syncQueue();
      } else {
        setStatus('SYNCED');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queue.length, syncQueue]);

  // Manual trigger
  const addToQueue = (payload: T) => {
    const item = { id: Date.now().toString(), payload, timestamp: Date.now() };
    setQueue(q => [...q, item]);
    if (isOnline) {
      // Defer sync slightly to allow state to settle
      setTimeout(syncQueue, 500);
    } else {
      setStatus('OFFLINE');
    }
  };

  return { isOnline, status, queue, addToQueue, syncQueue };
}
