'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MerchantSidebar, getDisplayShopType } from '@/components/merchant/MerchantSidebar';
import { useAuth } from '@/context/AuthContext';
import {
  Store,
  AlertTriangle,
  Menu,
  LayoutDashboard,
  Receipt,
  Boxes,
  ShoppingCart,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { PRESET_BUSINESS_TYPES } from '@/lib/presets/businessTypes';
import { DatabaseDisconnectedPopup } from '@/components/common/DatabaseDisconnectedPopup';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const { user, company, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isPlanExpired = React.useMemo(() => {
    if (!company) return false;
    if (company.subscriptionStatus === 'EXPIRED') return true;
    if (company.subscriptionExpiresAt && new Date(company.subscriptionExpiresAt).getTime() < Date.now()) {
      return true;
    }
    return false;
  }, [company]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-sm font-semibold animate-pulse">Loading merchant workspace...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center max-w-sm">
          <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Sign In Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Please sign in with your Merchant credentials to access the merchant workspace.
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

  if (user.role !== 'MERCHANT' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-200 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Merchant Portal Protected</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            You do not have active merchant administrator rights for this portal.
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
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden relative">
      <DatabaseDisconnectedPopup />
      {/* Mobile Top Header (hidden on md and above) */}
      <header className="md:hidden flex-shrink-0 bg-white text-slate-900 px-3 sm:px-4 h-14 flex items-center justify-between border-b border-slate-200 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo / Business Name according to Business Setup preference */}
          <div className="flex items-center gap-2.5 min-w-0">
            {(company?.headerDisplayMode === 'BOTH' ||
              company?.headerDisplayMode === 'LOGO_ONLY' ||
              !company?.headerDisplayMode) && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                <img
                  src={company?.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            )}

            {(company?.headerDisplayMode === 'BOTH' ||
              company?.headerDisplayMode === 'NAME_ONLY' ||
              !company?.headerDisplayMode) && (
              <div className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                {company?.name || 'Vypaar Store'}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Right Controls: Logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <MerchantSidebar
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <main className="flex-1 w-full min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 pb-20 md:pb-8">
          {isPlanExpired && (
            <div className="mb-4 p-3 bg-rose-600 text-white rounded-xl shadow-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wider">Subscription Plan Expired: </span>
                  <span className="text-rose-100">
                    Your account validity ended on {company?.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN') : 'recently'}. Invoicing and inventory modifications are locked. Contact Support (+91 8877300114) or Super Admin to renew services.
                  </span>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (hidden on md and above) */}
      <nav className="md:hidden flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around h-16 z-30 shadow-lg px-1">
        <Link
          href="/merchant"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            pathname === '/merchant'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        <Link
          href="/merchant/pos"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            pathname === '/merchant/pos'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <span className="text-[10px]">Billing</span>
        </Link>

        <Link
          href="/merchant/products"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            pathname.startsWith('/merchant/products')
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Products</span>
        </Link>

        <Link
          href="/merchant/sales"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            pathname.startsWith('/merchant/sales')
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Sales</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </div>
  );
}
