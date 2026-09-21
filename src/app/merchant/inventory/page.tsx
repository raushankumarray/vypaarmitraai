'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Product, StockMovement } from '@/types';
import {
  PackageCheck,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  History,
  Sliders,
  DollarSign,
  TrendingDown,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

export default function MerchantInventoryPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const tabParam = searchParams.get('tab');

  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Count Correction');

  const loadData = () => {
    if (!companyId) return;
    setProducts(localStore.getProducts(companyId));
    setMovements(localStore.getStockMovements(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const displayedProducts = useMemo(() => {
    if (filterParam === 'low_stock') {
      return products.filter((p) => p.currentStock <= (p.minStockAlert || 5));
    }
    return products;
  }, [products, filterParam]);

  // Inventory valuation
  const totalStockValue = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  const totalSellingValue = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setNewStockInput(prod.currentStock);
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    localStore.adjustStock({
      companyId,
      productId: selectedProduct.id,
      newQuantity: Number(newStockInput),
      reason: adjustReason,
      performedBy: user?.name || 'Store Manager',
    });

    setShowAdjustModal(false);
    setSelectedProduct(null);
  };

  const filteredMovements = movements.filter(
    (m) =>
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Inventory Valuation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{tabParam === 'challan' ? 'Stock & Delivery Challans' : 'Inventory Ledger & Valuation'}</span>
            {tabParam === 'challan' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Challan Register
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {tabParam === 'challan'
              ? 'Inward and outward stock transfer and dispatch challans record'
              : 'Immutable transaction history of every physical stock movement (inward, outward, damage & sales)'}
          </p>
        </div>

        {/* Valuation Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <div className="text-slate-400 font-semibold text-[10px] uppercase">Stock Valuation (Cost)</div>
            <div className="text-sm font-black text-slate-900">
              ₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <div className="text-slate-400 font-semibold text-[10px] uppercase">Retail Potential</div>
            <div className="text-sm font-black text-emerald-600">
              ₹{totalSellingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Adjust & Stock Health (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-[600px] flex flex-col">
          <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {filterParam === 'low_stock' ? 'Low Stock Alerts' : 'Quick Stock Adjustment'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {filterParam === 'low_stock' ? 'Products below safety threshold' : 'Pick any product to correct physical count'}
              </p>
            </div>
            {filterParam === 'low_stock' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {displayedProducts.length} Items Alert
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {displayedProducts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                {filterParam === 'low_stock' ? 'No low stock items found. All inventory healthy!' : 'No products found.'}
              </div>
            ) : (
              displayedProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      SKU: {p.sku} • In Hand: <span className="font-bold text-slate-800">{p.currentStock} {p.unit}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAdjust(p)}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 font-bold rounded-lg text-[11px] transition-colors"
                  >
                    Adjust
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Immutable Stock Movements Stream (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Immutable Stock Movements History</span>
              </h3>
              <p className="text-xs text-slate-500">Every change creates a non-destructible log</p>
            </div>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter movements..."
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[520px]">
            {filteredMovements.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No stock movements logged yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Reason / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMovements.map((sm) => (
                    <tr key={sm.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(sm.createdAt).toLocaleDateString()} {new Date(sm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-900">{sm.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sm.sku}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {sm.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold">
                        <span className={sm.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {sm.quantity >= 0 ? `+${sm.quantity}` : sm.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-black text-slate-800">
                        {sm.newStock}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        <div>{sm.notes || sm.referenceType || '-'}</div>
                        <div className="text-[10px] text-slate-400">By: {sm.performedBy}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Adjust Stock Count</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <span className="text-slate-500">Item:</span>
                <div className="font-bold text-slate-900 text-sm">{selectedProduct.name}</div>
                <div className="text-[11px] text-slate-400">
                  Current In-Hand Stock: <span className="font-bold text-blue-600">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Physical Stock Count</label>
                <input
                  type="number"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="Physical Count Correction">Physical Count Correction</option>
                  <option value="Damaged Stock Write-off">Damaged Stock Write-off</option>
                  <option value="Expired Stock Removal">Expired Stock Removal</option>
                  <option value="Internal Store Consumption">Internal Store Consumption</option>
                  <option value="Supplier Replacement">Supplier Replacement</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
