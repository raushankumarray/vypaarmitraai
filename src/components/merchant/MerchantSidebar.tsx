'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BrandName } from '@/components/common/BrandName';
import { PRESET_BUSINESS_TYPES } from '@/lib/presets/businessTypes';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  ScrollText,
  Undo2,
  FileCheck,
  Boxes,
  PlusCircle,
  SlidersHorizontal,
  AlertCircle,
  Users,
  Truck,
  UserPlus,
  PlusSquare,
  Briefcase,
  BarChart3,
  ShoppingBag,
  Wallet,
  ShieldCheck,
  Sparkles,
  Bell,
  Headphones,
  UserCog,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';

interface SubNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface DropdownNavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems: SubNavItem[];
}

interface MerchantSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSupport?: () => void;
  onOpenReturn?: () => void;
}

/**
 * Format raw business/shop type strings cleanly
 * E.g. "custom_software_services_4696" -> "Software services"
 */
export function getDisplayShopType(company?: {
  customBusinessTypeName?: string;
  businessTypeId?: string;
} | null): string {
  if (!company) return 'Software services';

  if (company.customBusinessTypeName && company.customBusinessTypeName.trim()) {
    const raw = company.customBusinessTypeName.trim();
    return formatCleanText(raw);
  }

  const preset = PRESET_BUSINESS_TYPES.find((b) => b.id === company.businessTypeId);
  if (preset) return preset.name;

  if (company.businessTypeId) {
    const cleaned = company.businessTypeId
      .replace(/^custom_/i, '')
      .replace(/_\d+$/, '')
      .replace(/_/g, ' ')
      .trim();
    if (cleaned) {
      return formatCleanText(cleaned);
    }
  }

  return 'Software services';
}

function formatCleanText(text: string): string {
  const words = text.replace(/_/g, ' ').split(/\s+/);
  if (words.length === 0) return text;
  return words
    .map((w, idx) => (idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

export function MerchantSidebar({
  isOpenMobile = false,
  onCloseMobile,
  onOpenReturn,
}: MerchantSidebarProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, company, logout } = useAuth();

  // Dropdown expansion state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    billing: false,
    inventory: false,
    parties: false,
    business: false,
    accounts: false,
  });

  // Auto-expand relevant dropdown based on active route
  useEffect(() => {
    setExpanded((prev) => ({
      ...prev,
      billing:
        prev.billing ||
        pathname.startsWith('/merchant/pos') ||
        pathname.startsWith('/merchant/sales') ||
        pathname.startsWith('/merchant/billing'),
      inventory:
        prev.inventory ||
        pathname.startsWith('/merchant/products') ||
        pathname.startsWith('/merchant/inventory'),
      parties:
        prev.parties ||
        pathname.startsWith('/merchant/customers') ||
        pathname.startsWith('/merchant/suppliers'),
      business:
        prev.business ||
        pathname.startsWith('/merchant/reports') ||
        pathname.startsWith('/merchant/purchases') ||
        pathname.startsWith('/merchant/expenses') ||
        pathname.startsWith('/merchant/employees') ||
        pathname.startsWith('/merchant/attendance'),
      accounts:
        prev.accounts ||
        pathname.startsWith('/merchant/account'),
    }));
  }, [pathname]);

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to test if a subitem href matches current URL
  const isSubItemActive = (href: string) => {
    const [targetPath, targetQuery] = href.split('?');
    if (pathname !== targetPath) return false;

    if (!targetQuery) {
      if (targetPath === '/merchant/pos') return searchParams.get('tab') !== 'drafts';
      if (targetPath === '/merchant/sales') return searchParams.get('action') !== 'return';
      if (targetPath === '/merchant/products') return searchParams.get('action') !== 'new';
      if (targetPath === '/merchant/customers') return searchParams.get('action') !== 'new';
      if (targetPath === '/merchant/suppliers') return searchParams.get('action') !== 'new';
      if (targetPath === '/merchant/inventory') return !searchParams.get('tab') && !searchParams.get('filter');
      return true;
    }

    const params = new URLSearchParams(targetQuery);
    let isMatched = true;
    params.forEach((v, k) => {
      if (searchParams.get(k) !== v) {
        isMatched = false;
      }
    });
    return isMatched;
  };

  // Human-readable shop type
  const displayShopType = useMemo(() => getDisplayShopType(company), [company]);

  // Dropdown groups configuration
  const dropdownSections: DropdownNavSection[] = [
    {
      id: 'billing',
      title: 'Billing',
      icon: Receipt,
      subItems: [
        { href: '/merchant/pos', label: 'New Bill', icon: PlusCircle },
        { href: '/merchant/pos?tab=drafts', label: 'Draft Bill', icon: FileText },
        { href: '/merchant/sales', label: 'Bill History', icon: ScrollText },
        {
          href: '/merchant/sales?action=return',
          label: 'Return Bill',
          icon: Undo2,
          onClick: onOpenReturn,
        },
        { href: '/merchant/inventory?tab=challan', label: 'Bill Challan', icon: FileCheck },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: Boxes,
      subItems: [
        { href: '/merchant/products', label: 'All Products / Items', icon: Boxes },
        { href: '/merchant/products?action=new', label: 'Add Product', icon: PlusCircle },
        { href: '/merchant/inventory', label: 'Stock Movements / Adjustments', icon: SlidersHorizontal },
        { href: '/merchant/inventory?filter=low_stock', label: 'Low Stock Alerts', icon: AlertCircle },
        { href: '/merchant/inventory?tab=challan', label: 'Stock Challan', icon: FileCheck },
      ],
    },
    {
      id: 'parties',
      title: 'Parties',
      icon: Users,
      subItems: [
        { href: '/merchant/customers', label: 'Customers (Khata / Dues)', icon: Users },
        { href: '/merchant/suppliers', label: 'Suppliers', icon: Truck },
        { href: '/merchant/customers?action=new', label: 'Add Customer', icon: UserPlus },
        { href: '/merchant/suppliers?action=new', label: 'Add Supplier', icon: PlusSquare },
      ],
    },
    {
      id: 'business',
      title: 'Business',
      icon: Briefcase,
      subItems: [
        { href: '/merchant/reports', label: 'Reports', icon: BarChart3 },
        { href: '/merchant/purchases', label: 'Purchases', icon: ShoppingBag },
        { href: '/merchant/expenses', label: 'Expenses', icon: Wallet },
        { href: '/merchant/employees', label: 'Staff & Roles', icon: ShieldCheck },
      ],
    },
  ];

  const accountsSection: DropdownNavSection = {
    id: 'accounts',
    title: 'Accounts',
    icon: UserCog,
    subItems: [
      { href: '/merchant/account/personal', label: 'Personal Details', icon: User },
      { href: '/merchant/account/business', label: 'Business Details', icon: Building2 },
    ],
  };

  const renderContent = (isMobileView = false) => (
    <div className="flex flex-col h-full select-none bg-[#0f1424] text-slate-300">
      {/* 1. Header: VypaarMitra AI Brand + Desktop Firm Name & Shop Type */}
      <div className="p-4 pb-3 border-b border-slate-800/80 bg-[#0d1220]">
        <div className="flex items-center justify-between">
          <Link
            href="/merchant"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-900 border border-slate-700/60">
              <img
                src={company?.logoUrl || '/logo.png'}
                alt="Logo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <BrandName size="sm" theme="dark" />
          </Link>

          {isMobileView && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Mode Only: Business Firm Name & Clean Shop Type */}
        <div className="hidden md:block mt-3 pt-2.5 border-t border-slate-800/70">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs tracking-tight truncate">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate">{company?.name || 'My Firm'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate flex items-center gap-1">
            <span className="text-slate-400">Shop Type :</span>
            <span className="text-indigo-300 font-semibold truncate">{displayShopType}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Items */}
      <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {/* 1. Dashboard */}
        <Link
          href="/merchant"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            pathname === '/merchant'
              ? 'bg-[#5844e3] text-white font-bold shadow-md shadow-[#5844e3]/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 flex-shrink-0 ${
              pathname === '/merchant' ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
          />
          <span className="truncate">Dashboard</span>
        </Link>

        {/* 2-5. Dropdowns: Billing, Inventory, Parties, Business */}
        {dropdownSections.map((section) => {
          const isOpen = Boolean(expanded[section.id]);
          const SectionIcon = section.icon;
          const isSectionActive = section.subItems.some((sub) => isSubItemActive(sub.href));

          return (
            <div key={section.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSectionActive
                    ? 'bg-slate-800/90 text-indigo-300 font-bold border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <SectionIcon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSectionActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{section.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800/90 ml-3 animate-in fade-in duration-150">
                  {section.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isActive = isSubItemActive(sub.href);

                    if (sub.onClick) {
                      return (
                        <button
                          key={sub.label}
                          type="button"
                          onClick={() => {
                            onCloseMobile?.();
                            sub.onClick?.();
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-[#5844e3] text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => onCloseMobile?.()}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#5844e3] text-white font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 6. AI Assistant (directly below Business, without Operations & Account divider) */}
        <Link
          href="/merchant/ai"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            pathname === '/merchant/ai'
              ? 'bg-[#5844e3] text-white font-bold shadow-md shadow-[#5844e3]/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Sparkles
              className={`w-4 h-4 flex-shrink-0 ${
                pathname === '/merchant/ai' ? 'text-white' : 'text-amber-400'
              }`}
            />
            <span className="truncate">AI Assistant</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PRO
          </span>
        </Link>

        {/* 7. Notifications Page */}
        <Link
          href="/merchant/notifications"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            pathname === '/merchant/notifications'
              ? 'bg-[#5844e3] text-white font-bold shadow-md shadow-[#5844e3]/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Bell
              className={`w-4 h-4 flex-shrink-0 ${
                pathname === '/merchant/notifications' ? 'text-white' : 'text-sky-400'
              }`}
            />
            <span className="truncate">Notifications</span>
          </div>
        </Link>

        {/* 8. Supports Page (Separate page) */}
        <Link
          href="/merchant/support"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            pathname === '/merchant/support'
              ? 'bg-[#5844e3] text-white font-bold shadow-md shadow-[#5844e3]/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <Headphones
            className={`w-4 h-4 flex-shrink-0 ${
              pathname === '/merchant/support' ? 'text-white' : 'text-emerald-400'
            }`}
          />
          <span className="truncate">Supports</span>
        </Link>

        {/* 9. Accounts (Dropdown containing Personal Details & Business Details) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection(accountsSection.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              pathname.startsWith('/merchant/account')
                ? 'bg-slate-800/90 text-indigo-300 font-bold border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <UserCog
                className={`w-4 h-4 flex-shrink-0 ${
                  pathname.startsWith('/merchant/account') ? 'text-indigo-400' : 'text-purple-400'
                }`}
              />
              <span className="truncate">Accounts</span>
            </div>
            {expanded.accounts ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )}
          </button>

          {expanded.accounts && (
            <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800/90 ml-3 animate-in fade-in duration-150">
              {accountsSection.subItems.map((sub) => {
                const SubIcon = sub.icon;
                const isActive = pathname === sub.href;

                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => onCloseMobile?.()}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#5844e3] text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 3. Footer: User identity & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d1220] flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="text-xs font-bold text-white truncate">
            {user?.name || 'Merchant Owner'}
          </div>
          <div className="text-[10px] text-purple-400 font-semibold truncate">
            @{user?.username || 'merchant'}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Logout"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Dark Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0f1424] border-r border-slate-800 flex-shrink-0 flex-col h-full select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[85vw] bg-[#0f1424] text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800 z-50 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
