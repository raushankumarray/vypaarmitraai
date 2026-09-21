'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LogOut, Shield, Store, User as UserIcon, Code2, HeadphonesIcon, Menu } from 'lucide-react';
import { BrandName } from '@/components/common/BrandName';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps = {}) {
  const { user, company, logout } = useAuth();
  const { t } = useLanguage();

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3" /> NPB Super Admin
          </span>
        );
      case 'MERCHANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Store className="w-3 h-3" /> {company?.name || 'Merchant Admin'}
          </span>
        );
      case 'EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <UserIcon className="w-3 h-3" /> Staff ({user.subRole || 'Cashier'})
          </span>
        );
      case 'SUPPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <HeadphonesIcon className="w-3 h-3" /> Support ({user.supportLevel || 'L1'})
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <Code2 className="w-3 h-3" /> Developer Infra
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="p-2 -ml-1 sm:ml-0 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="VypaarMitra Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <BrandName size="md" theme="light" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right Navigation & Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
                {getRoleBadge()}
              </div>

              <button
                onClick={logout}
                title={t('logout')}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
