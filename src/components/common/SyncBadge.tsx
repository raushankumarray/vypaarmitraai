'use client';

import React from 'react';
import { useSync } from '@/context/SyncContext';
import { useLanguage } from '@/context/LanguageContext';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export function SyncBadge() {
  const { syncState, isOnline, isFirebaseActive, triggerSync } = useSync();
  const { t } = useLanguage();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <CloudOff className="w-3.5 h-3.5 animate-pulse" />
        <span>{t('offline')}</span>
      </div>
    );
  }

  if (syncState === 'SAVING') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{t('saving')}</span>
      </div>
    );
  }

  if (syncState === 'SYNCING') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{t('syncing')}</span>
      </div>
    );
  }

  if (syncState === 'FAILED') {
    return (
      <button
        onClick={() => triggerSync()}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>{t('syncFailed')}</span>
      </button>
    );
  }

  return (
    <div
      onClick={() => triggerSync()}
      title={isFirebaseActive ? "Firebase Live Connected" : "Local Store Active (Click to Sync)"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>{isFirebaseActive ? 'Firebase Live' : t('synced')}</span>
    </div>
  );
}
