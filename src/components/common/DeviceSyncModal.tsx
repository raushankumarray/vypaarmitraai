'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { localStore } from '@/lib/store/localStore';
import { Smartphone, Copy, Check, X, ShieldCheck, QrCode } from 'lucide-react';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceSyncModal({ isOpen, onClose }: DeviceSyncModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      const cfg = localStore.getFirebaseCloudConfig();
      const adminCreds = (localStore as any).state?.userCredentials?.['usr_superadmin_bootstrap'];
      const currentOrigin = window.location.origin;

      const payload = {
        firebaseCloud: cfg,
        adminPass: adminCreds || undefined,
        timestamp: Date.now(),
      };

      const base64Token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const fullSyncUrl = `${currentOrigin}/login?device_sync=${base64Token}`;
      setSyncUrl(fullSyncUrl);

      QRCode.toDataURL(fullSyncUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn('QR Code generation notice:', err));
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (navigator?.clipboard && syncUrl) {
      navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Connect Another Device
            </h3>
            <p className="text-xs text-slate-500">
              Instantly pair phone, tablet, or another laptop
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to Connect Device"
              className="w-56 h-56 rounded-xl object-contain shadow-sm border border-slate-100 bg-white p-2"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <p className="text-[11.5px] font-semibold text-slate-600 mt-3 text-center">
            Scan with your phone's camera to pair immediately
          </p>
        </div>

        {/* 1-Click Copy Link */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Or Share 1-Click Setup Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={syncUrl}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 select-all truncate"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Opening this link on another device automatically connects the Firebase database and applies your security credentials without any manual setup!
          </span>
        </div>
      </div>
    </div>
  );
}
