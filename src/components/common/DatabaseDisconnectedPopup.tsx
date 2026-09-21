'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { localStore } from '@/lib/store/localStore';
import { Database, Flame, X, AlertTriangle, ArrowRight, ShieldCheck, Cloud } from 'lucide-react';

export function DatabaseDisconnectedPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  const checkConnection = () => {
    const cfg = localStore.getFirebaseCloudConfig();
    const connected = Boolean(cfg?.connected);
    setIsConnected(connected);

    // If disconnected and user hasn't dismissed in current session, trigger modal
    // Don't show modal on the settings page itself so user can comfortably type credentials
    if (!connected && !hasDismissedModal && pathname !== '/superadmin/settings') {
      setShowModal(true);
    } else if (connected) {
      setShowModal(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const unsub = localStore.subscribe(() => {
      checkConnection();
    });
    return () => unsub();
  }, [hasDismissedModal, pathname]);

  const handleOpenSetup = () => {
    setShowModal(false);
    router.push('/superadmin/settings?tab=firebase');
  };

  const handleDismiss = () => {
    setShowModal(false);
    setHasDismissedModal(true);
  };

  if (isConnected) return null;

  return (
    <>
      {/* 1. Persistent Top Bar Alert when Disconnected */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs px-3 sm:px-4 py-2 flex items-center justify-between shadow-md relative z-40">
        <div className="flex items-center gap-2 max-w-4xl truncate">
          <div className="p-1 bg-white/20 rounded-md shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <span className="font-bold tracking-tight">Database Disconnected:</span>
          <span className="opacity-90 hidden sm:inline">
            Connect Firebase setup to auto-save and sync data to Realtime Database &amp; Cloud Firestore.
          </span>
          <span className="opacity-90 sm:hidden">
            Connect database setup to sync data.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            onClick={handleOpenSetup}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white text-amber-900 font-bold rounded-lg hover:bg-amber-50 active:scale-95 transition-all text-[11px] shadow-xs cursor-pointer"
          >
            <span>Connect Setup</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Disconnected Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-amber-200 shadow-2xl space-y-4 text-center relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Dual Database Badge Icon */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Database Connection Required
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Please connect database setup after setup can save and sync data across your platform.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Dual-Engine Cloud Sync</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When connected, all panel records auto-save simultaneously to <strong>Firebase Realtime Database</strong> and <strong>Cloud Firestore</strong> with zero data loss.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
              <button
                type="button"
                onClick={handleOpenSetup}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Connect Database Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
