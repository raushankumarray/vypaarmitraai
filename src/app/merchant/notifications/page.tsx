'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import {
  Bell,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle2,
  Boxes,
  ArrowRight,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'STOCK' | 'KHATA' | 'BILL' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  link?: string;
  linkText?: string;
  severity: 'warning' | 'info' | 'critical';
}

export default function MerchantNotificationsPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [dismissed, setDismissed] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  const products = useMemo(() => localStore.getProducts(companyId), [companyId]);
  const customers = useMemo(() => localStore.getCustomers(companyId), [companyId]);
  const sales = useMemo(() => localStore.getSales(companyId), [companyId]);

  // Dynamically generate real-time alerts from local store
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Low stock & Out of stock alerts
    products.forEach((p) => {
      if (p.currentStock <= 0) {
        list.push({
          id: `out_of_stock_${p.id}`,
          type: 'STOCK',
          title: 'Item Out of Stock',
          message: `"${p.name}" has reached 0 ${p.unit}. Immediate restock required.`,
          time: 'Just now',
          link: '/merchant/inventory',
          linkText: 'Adjust Stock',
          severity: 'critical',
        });
      } else if (p.currentStock <= (p.minStockAlert || 5)) {
        list.push({
          id: `low_stock_${p.id}`,
          type: 'STOCK',
          title: 'Low Stock Warning',
          message: `"${p.name}" has only ${p.currentStock} ${p.unit} remaining (Threshold: ${p.minStockAlert || 5}).`,
          time: 'Stock alert',
          link: '/merchant/inventory?filter=low_stock',
          linkText: 'View Low Stock',
          severity: 'warning',
        });
      }
    });

    // 2. Overdue / Outstanding Khata receivables
    customers
      .filter((c) => (c.totalDue || 0) > 0)
      .slice(0, 5)
      .forEach((c) => {
        list.push({
          id: `due_${c.id}`,
          type: 'KHATA',
          title: 'Outstanding Khata Balance',
          message: `${c.name} has a pending due of ₹${(c.totalDue || 0).toLocaleString('en-IN')}.`,
          time: 'Payment Due',
          link: '/merchant/customers',
          linkText: 'Collect Khata',
          severity: 'warning',
        });
      });

    // 3. Plan validity status
    if (company?.subscriptionExpiresAt) {
      const daysLeft = Math.ceil(
        (new Date(company.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 7) {
        list.push({
          id: 'plan_expiry_alert',
          type: 'SYSTEM',
          title: 'Subscription Validity Alert',
          message: `Your current ${company.planId} subscription expires in ${daysLeft} days.`,
          time: 'Account Notice',
          link: '/merchant/support',
          linkText: 'Renew Plan',
          severity: daysLeft <= 2 ? 'critical' : 'warning',
        });
      }
    }

    // 4. Welcome notice
    list.push({
      id: 'welcome_note',
      type: 'SYSTEM',
      title: 'VypaarMitra Live Cloud Sync Active',
      message: 'Automatic dual database sync to Firebase Realtime Database & Cloud Firestore is operational.',
      time: 'Today',
      link: '/merchant',
      linkText: 'Go to Dashboard',
      severity: 'info',
    });

    return list;
  }, [products, customers, company]);

  const visibleNotifications = notifications
    .filter((n) => !dismissed.includes(n.id))
    .filter((n) => filterType === 'ALL' || n.type === filterType);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const handleClearAll = () => {
    setDismissed(notifications.map((n) => n.id));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>Store Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock alerts, khata dues reminders, and account operational updates
          </p>
        </div>

        {visibleNotifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'STOCK', 'KHATA', 'SYSTEM'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === type
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {type === 'ALL' ? 'All Alerts' : type === 'STOCK' ? 'Inventory' : type === 'KHATA' ? 'Khata Dues' : 'System'}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      {visibleNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="font-bold text-sm text-slate-900">All caught up!</div>
          <p className="text-xs text-slate-500">No new alerts or pending notices for your store right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((item) => {
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isCritical
                    ? 'bg-rose-50/70 border-rose-200'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-600'
                        : isWarning
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {item.type === 'STOCK' ? (
                      <Boxes className="w-4 h-4" />
                    ) : item.type === 'KHATA' ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({item.time})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-blue-600 font-bold text-xs transition-colors"
                    >
                      <span>{item.linkText || 'View'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
