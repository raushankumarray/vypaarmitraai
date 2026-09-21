'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { localStore } from '@/lib/store/localStore';
import { Product, BusinessType } from '@/types';
import { PRESET_BUSINESS_TYPES } from '@/lib/presets/businessTypes';
import {
  Boxes,
  PlusCircle,
  Search,
  Barcode,
  Download,
  Upload,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
  PackageCheck,
  CheckCircle,
  X,
  Calendar,
  Lock,
  Phone,
} from 'lucide-react';

export default function MerchantProductsPage() {
  const searchParams = useSearchParams();
  const { company, user } = useAuth();
  const { t } = useLanguage();
  const companyId = company?.id || user?.companyId || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Business type configuration
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);

  // Plan Expiration Check
  const isPlanExpired = useMemo(() => {
    if (!company) return false;
    if (company.subscriptionStatus === 'EXPIRED') return true;
    if (company.subscriptionExpiresAt && new Date(company.subscriptionExpiresAt).getTime() < Date.now()) {
      return true;
    }
    return false;
  }, [company]);

  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Form Fields (Matching Image 4)
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [category, setCategory] = useState('');
  const [hsn, setHsn] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [mrp, setMrp] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  const [batchNo, setBatchNo] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    if (!companyId) return;

    // Auto-seed starter stock if merchant has 0 products
    localStore.seedCompanyInitialStock(companyId, company?.businessTypeId || 'kirana');

    const prods = localStore.getProducts(companyId);
    setProducts(prods);

    // Load business type configuration
    const bTypeId = company?.businessTypeId || 'kirana';
    const bType =
      localStore.getBusinessTypes().find((b) => b.id === bTypeId) ||
      PRESET_BUSINESS_TYPES.find((b) => b.id === bTypeId) ||
      PRESET_BUSINESS_TYPES[0];
    setBusinessType(bType);
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    if (searchParams.get('action') === 'new') {
      handleOpenNew();
    }
    return () => unsub();
  }, [companyId, searchParams]);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Open Add New Product Modal
  const handleOpenNew = () => {
    if (isPlanExpired) {
      setShowRenewalModal(true);
      return;
    }

    setEditingProductId(null);
    setName('');
    const randomCode = Date.now().toString().slice(-6);
    setItemCode(`ITEM-${randomCode}`);

    // Determine smart defaults based on business type
    const isMedical =
      company?.businessTypeId === 'medical_pharmacy' ||
      (businessType?.name || '').toLowerCase().includes('medical');

    if (isMedical) {
      setCategory('Tablets');
      setUnit('STRIP');
      setGstRate(12);
      setHsn('3004');
    } else {
      setCategory(businessType?.defaultCategories?.[0] || 'General');
      setUnit(businessType?.defaultUnits?.[0] || 'PCS');
      setGstRate(businessType?.defaultTaxRate || 0);
      setHsn('0000');
    }

    setMrp(0);
    setSaleRate(0);
    setQuantity(0);
    setLowStockAlert(5);
    setBatchNo('');
    setMfgDate('');
    setExpiryDate('');
    setError(null);
    setShowModal(true);
  };

  // Open Edit Product Modal
  const handleEdit = (prod: Product) => {
    if (isPlanExpired) {
      setShowRenewalModal(true);
      return;
    }

    setEditingProductId(prod.id);
    setName(prod.name);
    setItemCode(prod.barcode || prod.sku);
    setCategory(prod.category);
    setHsn(prod.hsn || '');
    setUnit(prod.unit || 'PCS');
    setMrp(prod.mrp || 0);
    setSaleRate(prod.sellingPrice || 0);
    setGstRate(prod.taxRate || 0);
    setQuantity(prod.currentStock || 0);
    setLowStockAlert(prod.minStockAlert || 5);
    setBatchNo(prod.batchNumber || '');
    setMfgDate(prod.mfgDate || '');
    setExpiryDate(prod.expiryDate || '');
    setError(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (isPlanExpired) {
      setShowRenewalModal(true);
      return;
    }
    if (confirm('Are you sure you want to remove this stock item?')) {
      localStore.deleteProduct(id, companyId);
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPlanExpired) {
      setShowRenewalModal(true);
      return;
    }

    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }

    const prodId = editingProductId || `prod_${Date.now()}`;
    const productData: Product = {
      id: prodId,
      companyId,
      name: name.trim(),
      sku: itemCode.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: itemCode.trim() || `BAR-${Date.now().toString().slice(-4)}`,
      category: category.trim() || 'General',
      businessTypeId: company?.businessTypeId || 'kirana',
      unit: unit.trim() || 'PCS',
      purchasePrice: Number(saleRate) * 0.8, // estimated cost base
      sellingPrice: Number(saleRate) || 0,
      mrp: Number(mrp) || Number(saleRate) || 0,
      taxRate: Number(gstRate) || 0,
      hsn: hsn.trim() || '0000',
      openingStock: editingProductId ? (products.find((p) => p.id === prodId)?.openingStock || 0) : Number(quantity) || 0,
      currentStock: Number(quantity) || 0,
      minStockAlert: Number(lowStockAlert) || 5,
      reorderLevel: Number(lowStockAlert) || 5,
      status: 'ACTIVE',
      trackInventory: true,
      trackBatch: Boolean(batchNo.trim()),
      trackExpiry: Boolean(expiryDate),
      trackSerialNumber: false,
      batchNumber: batchNo.trim() || undefined,
      mfgDate: mfgDate || undefined,
      expiryDate: expiryDate || undefined,
      customFields: {
        batchNo: batchNo.trim(),
        mfgDate,
        expiryDate,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveProduct(productData, user?.name || 'Merchant');
    setShowModal(false);
    loadData();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Item Name', 'Code / Barcode', 'Category', 'Unit', 'MRP', 'Sale Rate', 'GST %', 'Stock', 'Batch No', 'Expiry'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      `"${p.barcode || p.sku}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.mrp,
      p.sellingPrice,
      p.taxRate,
      p.currentStock,
      `"${p.batchNumber || ''}"`,
      `"${p.expiryDate || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${company?.name || 'stock'}_catalog.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Plan Expired Warning Banner */}
      {isPlanExpired && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-xs">Subscription Plan Expired</div>
              <div className="text-[11px] text-rose-600">
                Your account validity expired on {company?.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN') : 'recently'}. Stock creation and modifications are disabled until renewal.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowRenewalModal(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex-shrink-0"
          >
            Renew Account
          </button>
        </div>
      )}

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock & Inventory Catalog</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {company?.customBusinessTypeName || businessType?.name || 'Store'} Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time barcode inventory, custom units, batches, manufacturing & expiry dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add stock item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name, barcode, SKU, or batch..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <h3 className="text-base font-bold text-slate-800">No stock items found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add your first inventory product or adjust your search filter.
            </p>
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
            >
              + Add stock item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3">Barcode / HSN</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">MRP</th>
                  <th className="px-4 py-3">Sale Rate</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Batch & Expiry</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-slate-700">{p.barcode || '—'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">HSN: {p.hsn || '0000'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{p.unit}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">₹{p.mrp?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3.5 font-black text-indigo-700 text-sm">
                        ₹{p.sellingPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.batchNumber ? (
                          <div>
                            <div className="font-mono text-slate-700 font-semibold text-[11px]">
                              Batch: {p.batchNumber}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Exp: {p.expiryDate || '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleEdit(p)}
                          title="Edit Stock Item"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Delete Item"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Stock Item Modal (Exact Match of Image 4) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {editingProductId ? 'Edit stock item' : 'Add stock item'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  MRP and sale rate are picked up automatically when this item is selected on a bill.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Modal Form Fields (Image 4) */}
            <form onSubmit={handleSaveProduct} className="p-4 sm:p-5 space-y-3.5 text-xs flex-1 overflow-y-auto">
              {/* Row 1: ITEM NAME */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  ITEM NAME
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dolo 650mg / Aashirvaad Atta 10kg"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Row 2: ITEM CODE / BARCODE & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    ITEM CODE / BARCODE
                  </label>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="e.g. 890111700101"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      CATEGORY
                    </label>
                    <span className="text-[10px] text-slate-400">used in dues report</span>
                  </div>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Tablets / Grains & Pulses"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Row 3: HSN / SAC & UNIT (Custom Editable Change) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    HSN / SAC
                  </label>
                  <input
                    type="text"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    placeholder="e.g. 3004 / 1101"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      UNIT
                    </label>
                    <span className="text-[10px] text-slate-400">type your own unit if needed</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value.toUpperCase())}
                    placeholder="PCS"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Row 4: MRP & SALE RATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    MRP
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    SALE RATE
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={saleRate}
                    onChange={(e) => setSaleRate(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-indigo-900"
                  />
                </div>
              </div>

              {/* Row 5: GST % & QUANTITY IN STOCK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    GST %
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    QUANTITY IN STOCK
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              {/* Row 6: LOW STOCK ALERT AT & BATCH NO. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    LOW STOCK ALERT AT
                  </label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(Number(e.target.value))}
                    placeholder="5"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      BATCH NO.
                    </label>
                    <span className="text-[10px] text-slate-400">optional</span>
                  </div>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder="e.g. DL-8821 / BATCH-01"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              {/* Row 7: MFG DATE & EXPIRY DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      MFG DATE
                    </label>
                    <span className="text-[10px] text-slate-400">manufacturing</span>
                  </div>
                  <input
                    type="date"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    EXPIRY DATE
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingProductId ? 'Update item' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Subscription Plan Expired</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your shop subscription validity has ended. All operations including adding items, updating stock, and billing are locked until renewal.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>Shop:</span>
                <span className="font-bold text-slate-900">{company?.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Plan:</span>
                <span className="font-bold text-indigo-700">{company?.planId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Validity Expired:</span>
                <span className="font-bold text-rose-600">
                  {company?.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN') : 'Expired'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600">
              Please contact NPB Media support or your platform administrator to renew your plan.
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg font-bold">
                <Phone className="w-3.5 h-3.5" />
                <span>+91 8877300114</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowRenewalModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
