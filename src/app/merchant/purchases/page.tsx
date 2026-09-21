'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Purchase, PurchaseItem, Supplier, Product } from '@/types';
import { Truck, PlusCircle, Search, Calendar, FileText, CheckCircle } from 'lucide-react';

export default function MerchantPurchasesPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New purchase state
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; price: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const loadData = () => {
    if (!companyId) return;
    setPurchases(localStore.getPurchases(companyId));
    setSuppliers(localStore.getSuppliers(companyId));
    setProducts(localStore.getProducts(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setPurchaseItems([...purchaseItems, { productId: products[0].id, quantity: 1, price: products[0].purchasePrice || 0 }]);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.length === 0) return;

    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    let subtotal = 0;
    const items: PurchaseItem[] = purchaseItems.map((pi) => {
      const prod = products.find((p) => p.id === pi.productId);
      const total = pi.quantity * pi.price;
      subtotal += total;
      return {
        productId: pi.productId,
        productName: prod?.name || 'Product',
        sku: prod?.sku || 'SKU',
        quantity: pi.quantity,
        unit: prod?.unit || 'Piece',
        purchasePrice: pi.price,
        taxRate: prod?.taxRate || 0,
        taxAmount: 0,
        total,
      };
    });

    const grandTotal = subtotal;
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    const newPurchase: Purchase = {
      id: `purch_${Date.now()}`,
      purchaseInvoiceNumber: invoiceNumber || `PUR-${Date.now().toString().slice(-5)}`,
      companyId,
      supplierId,
      supplierName: supplier.name,
      supplierGstin: supplier.gstin,
      items,
      subtotal,
      taxAmount: 0,
      grandTotal,
      paidAmount: Number(paidAmount) || 0,
      dueAmount,
      paymentStatus: dueAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'DUE',
      status: 'RECEIVED',
      purchaseDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.createPurchase(newPurchase, user?.name || 'Merchant');
    setShowAddModal(false);
    setPurchaseItems([]);
    setInvoiceNumber('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inward Stock Purchases</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase invoices. Saving an inward invoice automatically restocks inventory.
          </p>
        </div>

        <button
          onClick={() => {
            if (suppliers.length === 0 || products.length === 0) {
              alert('Please ensure you have registered at least one supplier and product first.');
              return;
            }
            setSupplierId(suppliers[0].id);
            setPurchaseItems([{ productId: products[0].id, quantity: 10, price: products[0].purchasePrice || 0 }]);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Inward Purchase</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Purchase Invoices Recorded</div>
            <p className="text-slate-400 mt-1">Log inward shipments to automatically update physical stock.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Invoice # & Date</th>
                  <th className="px-4 py-3.5">Supplier / Wholesaler</th>
                  <th className="px-4 py-3.5">Items Received</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Payment State</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">#{p.purchaseInvoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">{p.purchaseDate}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{p.supplierName}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.items.reduce((acc, it) => acc + it.quantity, 0)} units ({p.items.length} items)
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-sm">₹{p.grandTotal.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Inward Stock Purchase</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSavePurchase} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Supplier *</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.companyName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Supplier Bill Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. AGARWAL/2026/891"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Received Products (Stock Restocked Automatically)</span>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-2 py-1 bg-white border border-slate-300 font-bold rounded text-[11px]"
                    >
                      + Add Product Line
                    </button>
                  </div>

                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].productId = e.target.value;
                          const prod = products.find((p) => p.id === e.target.value);
                          if (prod) updated[idx].price = prod.purchasePrice || 0;
                          setPurchaseItems(updated);
                        }}
                        className="p-1.5 border border-slate-200 rounded font-semibold text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPurchaseItems(updated);
                        }}
                        placeholder="Qty"
                        className="p-1.5 border border-slate-200 rounded font-bold text-xs"
                      />

                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].price = Number(e.target.value);
                          setPurchaseItems(updated);
                        }}
                        placeholder="Cost (₹)"
                        className="p-1.5 border border-slate-200 rounded font-bold text-xs text-blue-700"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Amount Paid to Supplier Now (₹)</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-600"
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-slate-500">Inward Total:</div>
                    <div className="text-xl font-black text-slate-900">
                      ₹{purchaseItems.reduce((acc, it) => acc + it.quantity * it.price, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Receive & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
