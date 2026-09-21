'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Sale, Purchase, Expense, Customer, Supplier } from '@/types';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, Receipt, FileSpreadsheet } from 'lucide-react';

export default function MerchantReportsPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const loadData = () => {
    if (!companyId) return;
    setSales(localStore.getSales(companyId));
    setPurchases(localStore.getPurchases(companyId));
    setExpenses(localStore.getExpenses(companyId));
    setCustomers(localStore.getCustomers(companyId));
    setSuppliers(localStore.getSuppliers(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const totalSales = sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalTaxCollected = sales.reduce((acc, s) => acc + s.totalTax, 0);
  const cgstCollected = sales.reduce((acc, s) => acc + s.cgstTotal, 0);
  const sgstCollected = sales.reduce((acc, s) => acc + s.sgstTotal, 0);
  const estimatedGrossProfit = totalSales - totalPurchases;
  const estimatedNetProfit = estimatedGrossProfit - totalExpenses;

  // Export GST Report to CSV
  const handleExportGST = () => {
    const headers = ['Invoice Number', 'Date', 'Customer', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Invoice Value'];
    const rows = sales.map((s) => [
      `"${s.invoiceNumber}"`,
      `"${s.createdAt.split('T')[0]}"`,
      `"${s.customerName}"`,
      (s.subtotal - s.totalDiscount).toFixed(2),
      s.cgstTotal.toFixed(2),
      s.sgstTotal.toFixed(2),
      s.igstTotal.toFixed(2),
      s.grandTotal.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${company?.name || 'store'}_GSTR1_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & GST Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            GSTR-1 compliant tax filing, Profit & Loss analysis, and comprehensive cash flow
          </p>
        </div>

        <button
          onClick={handleExportGST}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Export GSTR-1 CSV</span>
        </button>
      </div>

      {/* P&L Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Gross Revenue (Sales)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{sales.length} Bills completed</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Purchases (COGS)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{purchases.length} Inward purchases</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Store Operating Expenses</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{expenses.length} Expense entries</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Estimated Net Profit</span>
          <div className={`text-2xl font-black mt-1 ${estimatedNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{estimatedNetProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Net profit after all operating expenses</div>
        </div>
      </div>

      {/* GST Breakdown Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">GST Summary Breakdown (Tax Invoices)</h2>
            <p className="text-xs text-slate-500">Separation of Central GST and State GST for official returns</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            GSTR-1 Format Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold">Total GST Collected:</span>
            <div className="text-xl font-black text-slate-900 mt-1">₹{totalTaxCollected.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold">CGST (Central Tax 50%):</span>
            <div className="text-xl font-black text-blue-700 mt-1">₹{cgstCollected.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold">SGST / UTGST (State Tax 50%):</span>
            <div className="text-xl font-black text-indigo-700 mt-1">₹{sgstCollected.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
