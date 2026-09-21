'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { localStore } from '@/lib/store/localStore';
import { Company, User } from '@/types';
import {
  Building2,
  Users,
  CreditCard,
  PlusCircle,
  Store,
  Settings2,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = () => {
    setCompanies(localStore.getAllCompanies());
    setUsers(localStore.getAllUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const merchants = users.filter((u) => u.role === 'MERCHANT');
  const employees = users.filter((u) => u.role === 'EMPLOYEE');
  const activeCompanies = companies.filter((c) => c.status === 'ACTIVE');
  const suspendedCompanies = companies.filter((c) => c.status === 'SUSPENDED');
  const plans = localStore.getPlans();
  const settings = localStore.getSystemSettings();

  const stats = [
    {
      title: 'Total Businesses',
      value: companies.length,
      sub: `${activeCompanies.length} Active • ${suspendedCompanies.length} Suspended`,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Active Merchants',
      value: merchants.length,
      sub: 'Dedicated Shop Administrators',
      icon: Store,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Staff Accounts',
      value: employees.length,
      sub: 'Cashiers & Store Workers',
      icon: Users,
      color: 'from-amber-600 to-orange-600',
    },
    {
      title: 'Subscriptions',
      value: activeCompanies.length,
      sub: `${plans.length} Active SaaS Tiers`,
      icon: CreditCard,
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.parentCompany} Enterprise Cloud Oversight &amp; Multi-Tenant Control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/superadmin/businesses?action=new"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard New Business</span>
          </Link>
          <Link
            href="/superadmin/settings"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors"
            title="System Settings"
          >
            <Settings2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.sub}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
