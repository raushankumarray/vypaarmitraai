'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Product, Sale, Customer, Supplier, Expense } from '@/types';
import { getDisplayShopType } from '@/components/merchant/MerchantSidebar';
import {
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  Undo2,
  AlertTriangle,
  PackageX,
  ArrowUpRight,
  Headphones,
  Phone,
  MessageSquare,
  Calendar,
  Store,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function MerchantDashboard() {
  const router = useRouter();
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    if (!companyId) return;
    setProducts(localStore.getProducts(companyId));
    setSales(localStore.getSales(companyId));
    setCustomers(localStore.getCustomers(companyId));
    setSuppliers(localStore.getSuppliers(companyId));
    setExpenses(localStore.getExpenses(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Today's dynamic date string & ISO date prefix
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];

  const todayFormattedDate = todayDateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Today's Completed Sales
  const todayCompletedSales = useMemo(() => {
    return sales.filter(
      (s) => s.createdAt.startsWith(todayStr) && s.status === 'COMPLETED'
    );
  }, [sales, todayStr]);

  const todaySalesTotal = useMemo(() => {
    return todayCompletedSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }, [todayCompletedSales]);

  // 2. Today's Returns
  const todayReturns = useMemo(() => {
    return sales.filter(
      (s) =>
        s.status === 'RETURNED' &&
        (s.updatedAt?.startsWith(todayStr) || s.createdAt.startsWith(todayStr))
    );
  }, [sales, todayStr]);

  const todayReturnsTotal = useMemo(() => {
    return todayReturns.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }, [todayReturns]);

  // 3. Pending Khata Dues
  const customersWithDues = useMemo(() => {
    return customers.filter((c) => (c.totalDue || 0) > 0);
  }, [customers]);

  const totalPendingDues = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.totalDue || 0), 0);
  }, [customers]);

  // 4. Stock Items in Hand & Valuation
  const totalStockItemsCount = products.length;
  const totalStockValuation = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + (p.currentStock || 0) * (p.purchasePrice || p.sellingPrice || 0),
      0
    );
  }, [products]);

  // 5. Low stock & Out of stock alerts
  const lowStockItems = useMemo(() => {
    return products.filter(
      (p) => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.minStockAlert || 5)
    );
  }, [products]);

  const outOfStockItems = useMemo(() => {
    return products.filter((p) => (p.currentStock || 0) <= 0);
  }, [products]);

  // 6. Last 7 Days Sales Trend
  const last7DaysData = useMemo(() => {
    const days: { date: string; label: string; dayName: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      const daySales = sales.filter(
        (s) => s.createdAt.startsWith(iso) && s.status === 'COMPLETED'
      );
      const dayTotal = daySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);

      days.push({
        date: iso,
        label,
        dayName,
        total: dayTotal,
      });
    }
    return days;
  }, [sales]);

  const max7DaysSale = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.total));
    return max > 0 ? max : 1;
  }, [last7DaysData]);

  const total7DaysRevenue = useMemo(() => {
    return last7DaysData.reduce((acc, d) => acc + d.total, 0);
  }, [last7DaysData]);

  // 7. Recent Bills
  const recentBills = useMemo(() => {
    return [...sales]
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .slice(0, 7);
  }, [sales]);

  const displayShopType = getDisplayShopType(company);
  const ownerGreetingName = user?.name || company?.ownerName || 'Merchant';

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* 1. Header & Greeting Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-blue-600">
              Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Namaste, {ownerGreetingName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold">
                <Store className="w-3.5 h-3.5" />
                <span>{displayShopType}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayFormattedDate}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <Link
              href="/merchant/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>New Bill (POS)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today&apos;s Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">
              ₹{todaySalesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
              {todayCompletedSales.length} bill(s) today
            </div>
          </div>
        </div>

        {/* Today's Returns */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today&apos;s Returns</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Undo2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">
              ₹{todayReturnsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-rose-700 font-bold mt-0.5">
              {todayReturns.length} return(s) processed
            </div>
          </div>
        </div>

        {/* Pending Dues */}
        <Link
          href="/merchant/customers"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">
              ₹{totalPendingDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-amber-700 font-bold mt-0.5">
              {customersWithDues.length} Khata debtors
            </div>
          </div>
        </Link>

        {/* Stock Items in Hand */}
        <Link
          href="/merchant/products"
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-colors flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock in Hand</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">
              {totalStockItemsCount} Items
            </div>
            <div className="text-[10px] text-blue-700 font-bold mt-0.5 truncate">
              Valuation: ₹{totalStockValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </Link>

        {/* Low Stock Alerts */}
        <Link
          href="/merchant/inventory?filter=low_stock"
          className={`p-4 rounded-2xl border shadow-xs transition-colors flex flex-col justify-between group ${
            outOfStockItems.length > 0 || lowStockItems.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-700">
              {lowStockItems.length + outOfStockItems.length} Items
            </div>
            <div className="text-[10px] text-rose-600 font-bold mt-0.5">
              {outOfStockItems.length} out • {lowStockItems.length} low stock
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Last 7 Days Sales Graph & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Last 7 Days Sales Visual Graph */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Last 7 Days Sales Performance</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Day-by-day revenue generated from counter bills</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400">7-Day Total Revenue</div>
              <div className="text-sm font-black text-slate-900 font-mono">
                ₹{total7DaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="flex-1 pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {last7DaysData.map((d) => {
                const heightPercent = max7DaysSale > 0 ? Math.max((d.total / max7DaysSale) * 100, 6) : 6;
                const isToday = d.dayName === 'Today';

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Tooltip amount */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap mb-1">
                      ₹{d.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-xl overflow-hidden flex items-end h-full p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30'
                            : 'bg-gradient-to-t from-slate-400 to-indigo-400 group-hover:from-blue-500 group-hover:to-indigo-500'
                        }`}
                      />
                    </div>

                    {/* Day labels */}
                    <div className="text-center">
                      <div className={`text-[11px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {d.dayName}
                      </div>
                      <div className="text-[9px] text-slate-400">{d.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Real-time Stock Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Inventory Alerts</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Low stock & depleted items</p>
            </div>
            <Link
              href="/merchant/inventory"
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Ledger →
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] pr-1">
            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <div className="font-bold text-slate-700">Stock Levels Healthy</div>
                <p>No inventory alerts right now.</p>
              </div>
            ) : (
              <>
                {outOfStockItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-rose-700 font-bold">Out of stock (0 {p.unit})</div>
                    </div>
                    <Link
                      href="/merchant/inventory"
                      className="px-2 py-1 bg-white border border-rose-300 text-rose-700 font-bold rounded-lg text-[10px] hover:bg-rose-50"
                    >
                      Restock
                    </Link>
                  </div>
                ))}

                {lowStockItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        {p.currentStock} {p.unit} left (Min: {p.minStockAlert || 5})
                      </div>
                    </div>
                    <Link
                      href="/merchant/inventory"
                      className="px-2 py-1 bg-white border border-amber-300 text-amber-800 font-bold rounded-lg text-[10px] hover:bg-amber-50"
                    >
                      Adjust
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Quick Support Link Banner */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900">Need Help?</div>
                <div className="text-[10px] text-slate-500">+91 8877300114</div>
              </div>
            </div>
            <Link
              href="/merchant/support"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-bold text-xs rounded-lg"
            >
              Support Desk →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Bills Details (Clicking on bill redirects to bill page) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Recent Bills Details</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Click any bill row to open its full invoice details</p>
          </div>

          <Link
            href="/merchant/sales"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            <span>View All Bills</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No Bills Generated Yet</div>
            <p>Generate your first bill using the POS Counter.</p>
            <Link
              href="/merchant/pos"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
            >
              Open POS Billing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Invoice # & Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentBills.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/merchant/sales?invoice=${sale.invoiceNumber}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-blue-700 group-hover:underline flex items-center gap-1.5">
                        <span>#{sale.invoiceNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleDateString('en-IN')}{' '}
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{sale.customerName || 'Cash Customer'}</div>
                      {sale.customerMobile && (
                        <div className="text-[10px] text-slate-400 font-mono">{sale.customerMobile}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      {sale.items?.length || 0} item(s)
                    </td>

                    <td className="px-4 py-3.5 font-black text-slate-900 text-sm">
                      ₹{(sale.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {sale.payments?.[0]?.method || 'CASH'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/merchant/sales?invoice=${sale.invoiceNumber}`);
                        }}
                        className="p-1.5 text-slate-400 group-hover:text-blue-600 transition-colors"
                        title="View Bill Details"
                      >
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
