'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/superadmin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Menu, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import { BrandName } from '@/components/common/BrandName';
import { DatabaseDisconnectedPopup } from '@/components/common/DatabaseDisconnectedPopup';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-sm font-semibold animate-pulse">Verifying administrative credentials...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Sign In Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Please sign in with your Super Administrator credentials to access this portal.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-200 text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            This console is strictly restricted to NPB Media Super Administrators.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
      <DatabaseDisconnectedPopup />
      {/* Mobile Top Header (hidden on md and above) */}
      <header className="md:hidden flex-shrink-0 bg-slate-900 text-white px-3 sm:px-4 h-14 flex items-center justify-between border-b border-slate-800 z-30 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="VypaarMitra Logo" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <BrandName size="xs" theme="dark" />
            <div className="text-[9px] font-semibold text-purple-400 truncate flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              <span>Super Admin</span>
            </div>
          </div>
        </div>

        {/* Mobile Right Controls: Profile/Logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <AdminSidebar
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <main className="flex-1 w-full min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
