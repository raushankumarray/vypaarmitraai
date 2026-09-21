'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Receipt, Clock, CheckCircle2, User } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user, company } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Terminal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Welcome, <span className="font-bold text-slate-800">{user?.name}</span> • Operating at {company?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Link
          href="/employee/billing"
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-amber-600">POS Billing Counter</div>
            <div className="text-xs text-slate-500">Scan barcodes & issue sales bills</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
