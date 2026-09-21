'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Sale } from '@/types';
import { ShoppingCart, Search, Printer, RotateCcw, Share2, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MerchantSalesPage() {
  const searchParams = useSearchParams();
  const invoiceParam = searchParams.get('invoice');
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadData = () => {
    if (!companyId) return;
    const all = localStore.getSales(companyId);
    setSales(all);
    if (invoiceParam) {
      setSearch(invoiceParam);
      const found = all.find((s) => s.invoiceNumber.toLowerCase() === invoiceParam.toLowerCase());
      if (found) {
        setSelectedSale(found);
      }
    }
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId, invoiceParam]);

  const handleReturn = (saleId: string) => {
    if (confirm('Process full sale return and automatically restock items back into inventory?')) {
      const ok = localStore.processSaleReturn(saleId, companyId, user?.name || 'Merchant');
      if (ok) {
        alert('Sale returned and stock successfully restored.');
      }
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Counter Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger with immutable audit records and returns management
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
          {sales.length} Bills Generated
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number or customer name..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Sales Records Found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Invoice # & Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Tax (GST)</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-blue-700">#{sale.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{sale.customerName}</div>
                      {sale.customerMobile && (
                        <div className="text-[10px] text-slate-400">{sale.customerMobile}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {sale.items.length} item(s)
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      ₹{sale.totalTax.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-sm">
                      ₹{sale.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {sale.payments?.[0]?.method || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleReturn(sale.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Process Return & Restock"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invoice Details</h3>
                <p className="text-[11px] text-slate-400 font-mono">#{selectedSale.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1.5">Purchased Items</div>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedSale.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>
                        {it.productName} ({it.quantity} {it.unit} @ ₹{it.unitPrice})
                      </span>
                      <span className="font-bold">₹{it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total:</span>
                  <span>₹{selectedSale.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">₹{selectedSale.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
