'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured } from '@/lib/firebase/config';

export type SyncState = 'SAVING' | 'SAVED' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'FAILED';

interface SyncContextType {
  syncState: SyncState;
  isOnline: boolean;
  isFirebaseActive: boolean;
  setSyncState: (state: SyncState) => void;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>('SYNCED');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setSyncState('SYNCING');
        setTimeout(() => setSyncState('SYNCED'), 1000);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setSyncState('OFFLINE');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const triggerSync = async () => {
    if (!isOnline) {
      setSyncState('OFFLINE');
      return;
    }
    setSyncState('SYNCING');
    try {
      // Simulate/trigger cloud flush
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSyncState('SYNCED');
    } catch {
      setSyncState('FAILED');
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncState,
        isOnline,
        isFirebaseActive: isFirebaseConfigured,
        setSyncState,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
