'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Customer } from '@/types';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  Wallet,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Share2,
} from 'lucide-react';

export default function MerchantCustomersPage() {
  const searchParams = useSearchParams();
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [gstin, setGstin] = useState('');
  const [city, setCity] = useState('');

  const loadData = () => {
    if (!companyId) return;
    setCustomers(localStore.getCustomers(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true);
    }
    return () => unsub();
  }, [companyId, searchParams]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      companyId,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      city: city.trim(),
      gstin: gstin.trim(),
      creditLimit: Number(creditLimit) || 5000,
      openingBalance: Number(openingBalance) || 0,
      totalPurchased: 0,
      totalPaid: 0,
      totalDue: Number(openingBalance) || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveCustomer(newCust);
    setShowAddModal(false);
    setName('');
    setMobile('');
    setEmail('');
    setOpeningBalance(0);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || payAmount <= 0) return;

    localStore.recordCustomerPayment(activeCustomer.id, Number(payAmount));
    setShowPayModal(false);
    setActiveCustomer(null);
    setPayAmount(0);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Khata & Udhar Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store credit limits, payment collections, outstanding balances, and WhatsApp reminders
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer name or mobile..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Customers Registered</div>
            <p className="text-slate-400 mt-1">Add your frequent and credit khata customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer & Phone</th>
                  <th className="px-4 py-3.5">Credit Limit</th>
                  <th className="px-4 py-3.5">Total Purchased</th>
                  <th className="px-4 py-3.5">Total Paid</th>
                  <th className="px-4 py-3.5">Current Due (उधारी)</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.mobile}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      ₹{cust.creditLimit.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-semibold">
                      ₹{cust.totalPurchased.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-emerald-600 font-semibold">
                      ₹{cust.totalPaid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-black text-sm">
                      <span className={cust.totalDue > 0 ? 'text-amber-600' : 'text-slate-700'}>
                        ₹{cust.totalDue.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {cust.totalDue > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setActiveCustomer(cust);
                              setPayAmount(cust.totalDue);
                              setShowPayModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-[11px] hover:bg-emerald-100"
                          >
                            Receive Due
                          </button>

                          <a
                            href={`https://api.whatsapp.com/send?phone=91${cust.mobile}&text=${encodeURIComponent(
                              `Namaste ${cust.name}, this is a gentle payment reminder from ${company?.name}. Your outstanding khata balance is ₹${cust.totalDue.toFixed(2)}. Please pay at your earliest convenience.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-lg text-[11px] hover:bg-blue-100 inline-flex items-center gap-1"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Remind</span>
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Customer Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Opening Due (₹)</label>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-amber-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      {showPayModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Collect Due Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <span className="text-slate-500">Customer:</span>
                  <div className="font-bold text-slate-900 text-sm">{activeCustomer.name}</div>
                  <div className="text-[11px] text-amber-700">
                    Total Outstanding: <span className="font-bold">₹{activeCustomer.totalDue.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Collected Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
