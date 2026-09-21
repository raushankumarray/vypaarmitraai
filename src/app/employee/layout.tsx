'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Receipt, ShoppingCart, Boxes, Clock, UserCheck, ChevronRight, AlertTriangle } from 'lucide-react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, company, isLoading, hasPermission } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-sm font-semibold animate-pulse">Loading employee workspace...</div>
      </div>
    );
  }

  if (user && user.role !== 'EMPLOYEE' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-200 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            This workspace is dedicated to store employees and cashiers.
          </p>
          <Link href="/login" className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/employee/billing', label: 'Fast POS Counter', icon: Receipt, permission: 'pos.billing' },
  ];

  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onMenuToggle={() => setIsMobileNavOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-shrink-0 flex-col p-3 space-y-1">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
            <div className="text-xs font-bold text-amber-900">{company?.name || 'Store Staff'}</div>
            <div className="text-[10px] text-amber-700 uppercase font-semibold">
              Role: {user?.subRole || 'Staff Member'}
            </div>
          </div>

          {links.map((l) => {
            if (l.permission && !hasPermission(l.permission)) return null;
            const Icon = l.icon;
            const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                  isActive ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{l.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </aside>

        {/* Mobile Off-Canvas Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
              onClick={() => setIsMobileNavOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-72 max-w-[85vw] bg-white text-slate-800 flex flex-col h-full shadow-2xl border-r border-slate-200 p-4 space-y-3 z-50 animate-in slide-in-from-left duration-200">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-xs font-bold text-amber-900">{company?.name || 'Store Staff'}</div>
                <div className="text-[10px] text-amber-700 uppercase font-semibold">
                  Role: {user?.subRole || 'Staff Member'}
                </div>
              </div>

              {links.map((l) => {
                if (l.permission && !hasPermission(l.permission)) return null;
                const Icon = l.icon;
                const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                      isActive ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{l.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </Link>
                );
              })}
            </aside>
          </div>
        )}

        <main className="flex-1 w-full min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
