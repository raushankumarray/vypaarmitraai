'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Supplier } from '@/types';
import { Truck, PlusCircle, Search, Phone, Building, CheckCircle } from 'lucide-react';

export default function MerchantSuppliersPage() {
  const searchParams = useSearchParams();
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const loadData = () => {
    if (!companyId) return;
    setSuppliers(localStore.getSuppliers(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true);
    }
    return () => unsub();
  }, [companyId, searchParams]);

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      companyId,
      name: name.trim(),
      companyName: companyName.trim() || name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      gstin: gstin.trim(),
      openingBalance: Number(openingBalance) || 0,
      payableBalance: Number(openingBalance) || 0,
      totalPurchases: 0,
      totalPaid: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveSupplier(newSup);
    setShowAddModal(false);
    setName('');
    setCompanyName('');
    setMobile('');
    setGstin('');
    setOpeningBalance(0);
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Wholesalers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Vendor accounts, purchase orders, payables, and payment settlements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplier name, company, or phone..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Suppliers Registered</div>
            <p className="text-slate-400 mt-1">Add your wholesalers and stock distributors.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Vendor & Contact</th>
                  <th className="px-4 py-3.5">Firm / Company</th>
                  <th className="px-4 py-3.5">Total Inward Purchases</th>
                  <th className="px-4 py-3.5">Total Paid</th>
                  <th className="px-4 py-3.5">Payable Balance</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      <div className="text-[11px] text-slate-500">{sup.mobile}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{sup.companyName}</div>
                      {sup.gstin && <div className="text-[10px] text-slate-400">GSTIN: {sup.gstin}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">₹{sup.totalPurchases.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-emerald-600">₹{sup.totalPaid.toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-black text-sm">
                      <span className={sup.payableBalance > 0 ? 'text-purple-700' : 'text-slate-700'}>
                        ₹{sup.payableBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sup.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Supplier Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunil Agarwal"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Agarwal Wholesale Distributors"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="GSTIN"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Payable Balance (₹)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
