'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/common/Header';
import { ShieldAlert, Lock, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

export default function ForcePasswordChangePage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updatePassword } = useAuth();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword === 'Admin@88') {
      setError('New password must be different from the default bootstrap password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsSubmitting(true);
    const ok = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (!ok) {
      setError('Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-3 border border-amber-200">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Mandatory Security Update</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                First login detected for <span className="font-semibold text-slate-800">{user?.username}</span>.
                You must replace the temporary default password with a permanent, secure password before proceeding.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Security Requirements:</div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle className={`w-3.5 h-3.5 ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span>Minimum 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle className={`w-3.5 h-3.5 ${newPassword && newPassword !== 'Admin@88' ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span>Different from initial default Admin@88</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span>Passwords match exactly</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Updating & Logging Audit Event...' : 'Set New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        NPB MEDIA • Security Auditing & Identity Management System
      </footer>
    </div>
  );
}
