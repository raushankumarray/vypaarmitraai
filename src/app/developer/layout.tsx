'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { useAuth } from '@/context/AuthContext';
import { Code2, ShieldAlert, Cpu, Activity, Database, Wrench } from 'lucide-react';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-sm font-semibold animate-pulse">Initializing developer diagnostic environment...</div>
      </div>
    );
  }

  if (user && user.role !== 'DEVELOPER' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-200 text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Developer Access Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            This infrastructure console is strictly restricted to NPB Media engineers.
          </p>
          <Link href="/login" className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onMenuToggle={() => setIsMobileNavOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-slate-950 text-slate-400 flex-shrink-0 flex-col p-3 space-y-1 border-r border-slate-800">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 mb-2">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>Developer Infra Console</span>
            </div>
            <div className="text-[10px] text-slate-500">Firebase & Backend Diagnostics</div>
          </div>

          <Link
            href="/developer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-lg shadow-blue-600/20 min-h-[44px]"
          >
            <Wrench className="w-4 h-4" />
            <span>10-Step Firebase Setup & Health</span>
          </Link>
        </aside>

        {/* Mobile Off-Canvas Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
              onClick={() => setIsMobileNavOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-72 max-w-[85vw] bg-slate-950 text-slate-400 flex flex-col h-full shadow-2xl border-r border-slate-800 p-4 space-y-3 z-50 animate-in slide-in-from-left duration-200">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span>Developer Infra Console</span>
                </div>
                <div className="text-[10px] text-slate-500">Firebase & Backend Diagnostics</div>
              </div>

              <Link
                href="/developer"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-lg shadow-blue-600/20 min-h-[44px]"
              >
                <Wrench className="w-4 h-4" />
                <span>10-Step Firebase Setup & Health</span>
              </Link>
            </aside>
          </div>
        )}

        <main className="flex-1 w-full min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
