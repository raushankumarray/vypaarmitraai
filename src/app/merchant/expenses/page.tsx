'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Expense } from '@/types';
import { DollarSign, PlusCircle, Search, Calendar, Tag, CheckCircle } from 'lucide-react';

export default function MerchantExpensesPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK'>('CASH');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    if (!companyId) return;
    setExpenses(localStore.getExpenses(companyId));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, [companyId]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      companyId,
      category,
      amount: Number(amount),
      paymentMethod,
      description: description.trim() || category,
      date,
      createdBy: user?.name || 'Cashier',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    localStore.saveExpense(newExp);
    setShowAddModal(false);
    setAmount(0);
    setDescription('');
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store overheads: rent, electricity, staff salary, transport and tea/snacks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Total Spent: </span>
            <span className="font-black text-slate-900">₹{totalExpense.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Store Expense</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No Expenses Recorded</div>
            <p className="text-slate-400 mt-1">Log store expenditures to calculate true monthly net profit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Payment Mode</th>
                  <th className="px-4 py-3.5">Amount (₹)</th>
                  <th className="px-4 py-3.5 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 text-slate-500">{exp.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800">{exp.description}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-600">{exp.paymentMethod}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-sm">₹{exp.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right text-slate-400 text-[11px]">{exp.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Record Store Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveExpense} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Rent">Shop Rent</option>
                    <option value="Electricity">Electricity & Power</option>
                    <option value="Salary">Staff Salary</option>
                    <option value="Transport">Transport / Freight</option>
                    <option value="Tea & Snacks">Tea & Refreshments</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Marketing">Marketing / Ads</option>
                    <option value="Other">Other Operating Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    placeholder="0.00"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-rose-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="CASH">Cash (Counter)</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Month electric bill receipt #8291"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
