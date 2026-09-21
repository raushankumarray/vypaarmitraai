'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { localStore } from '@/lib/store/localStore';
import { BrandName } from '@/components/common/BrandName';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users2,
  ScrollText,
  Settings2,
  ChevronRight,
  LogOut,
  Shield,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ isOpenMobile = false, onCloseMobile }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [systemSettings, setSystemSettings] = React.useState(localStore.getSystemSettings());

  React.useEffect(() => {
    const unsub = localStore.subscribe(() => {
      setSystemSettings(localStore.getSystemSettings());
    });
    return () => unsub();
  }, []);

  const links = [
    { href: '/superadmin', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/superadmin/businesses', label: 'Merchant Account', icon: Building2 },
    { href: '/superadmin/plans', label: t('plans'), icon: CreditCard },
    { href: '/superadmin/staff', label: t('supportAccounts'), icon: Users2 },
    { href: '/superadmin/audit', label: t('auditLogs'), icon: ScrollText },
    { href: '/superadmin/settings', label: t('systemSettings'), icon: Settings2 },
  ];

  const renderContent = (isMobileView = false) => (
    <div className="flex flex-col h-full select-none">
      {/* 1. Brand Header: Logo, Title & Tagline */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img
              src={systemSettings.logoUrl || '/logo.png'}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate">
              {systemSettings.appName && systemSettings.appName !== 'VypaarMitra AI' ? (
                <span className="font-extrabold text-sm tracking-tight text-white">{systemSettings.appName}</span>
              ) : (
                <BrandName size="sm" theme="dark" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2 mt-0.5">
              {systemSettings.tagline || 'Smart Business Management for Every Business'}
            </p>
          </div>
        </div>

        {isMobileView && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onCloseMobile?.()}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 font-bold'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* 3. Sidebar Footer: Super Admin Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        {/* User Identity & Logout Action */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-white truncate">
              {user?.name || 'NPB Master Administrator'}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 mt-0.5">
              <Shield className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span>NPB Super Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center flex-shrink-0 min-h-[44px] min-w-[44px]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Docked Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex-col border-r border-slate-800 h-full select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800 z-50 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
