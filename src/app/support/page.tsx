'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { SupportTicket, Company, User } from '@/types';
import { Headphones, Search, PlusCircle, CheckCircle, Clock, ShieldCheck, KeyRound } from 'lucide-react';

export default function SupportDashboardPage() {
  const { user } = useAuth();
  const supportLevel = user?.supportLevel || 'L1';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('TECHNICAL');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [selectedCompId, setSelectedCompId] = useState('');
  const [message, setMessage] = useState('');

  const loadData = () => {
    setTickets(localStore.getSupportTickets());
    setCompanies(localStore.getAllCompanies());
    setUsers(localStore.getAllUsers().filter((u) => u.role === 'MERCHANT'));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !selectedCompId) return;

    const comp = companies.find((c) => c.id === selectedCompId);
    const merchant = users.find((u) => u.companyId === selectedCompId);

    const ticketId = `tkt_${Date.now()}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      ticketNumber: `VM-HELP-${Date.now().toString().slice(-4)}`,
      companyId: selectedCompId,
      companyName: comp?.name || 'Store',
      merchantName: merchant?.name || 'Owner',
      merchantMobile: comp?.mobile || '',
      subject: subject.trim(),
      category,
      priority,
      status: 'OPEN',
      supportLevelRequired: 'L1',
      assignedToName: user?.name,
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user?.id || 'agent',
          senderName: user?.name || 'Agent',
          senderRole: 'SUPPORT',
          text: message.trim() || subject.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveSupportTicket(newTicket);
    localStore.addAuditLog({
      companyId: selectedCompId,
      userId: user?.id || 'support',
      userName: user?.name || 'Support Agent',
      userRole: 'SUPPORT',
      action: 'SUPPORT_TICKET_CREATED',
      module: 'support',
      entityType: 'ticket',
      entityId: ticketId,
      details: `Created support ticket #${newTicket.ticketNumber} for ${newTicket.companyName}`,
    });

    setShowNewTicketModal(false);
    setSubject('');
    setMessage('');
  };

  const handleAssistedPasswordReset = (merchant: User) => {
    if (supportLevel === 'L1' || supportLevel === 'L2') {
      alert('Your current support level does not permit password resets (Requires L3 or L4).');
      return;
    }

    const tempPass = `Reset@${Math.floor(1000 + Math.random() * 9000)}`;
    localStore.changeUserPassword(merchant.id, tempPass);
    localStore.addAuditLog({
      companyId: merchant.companyId,
      userId: user?.id || 'support',
      userName: user?.name || 'Support Agent',
      userRole: 'SUPPORT',
      action: 'SUPPORT_ASSISTED_PASSWORD_RESET',
      module: 'support',
      entityType: 'user',
      entityId: merchant.id,
      details: `Support Agent ${user?.name} reset password for merchant ${merchant.username}`,
    });

    alert(`Password reset for ${merchant.username}! Temporary password: ${tempPass}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-emerald-600" />
            <span>Support & Merchant Help Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            NPB Media Customer Operations • Authorized Level: <span className="font-bold text-emerald-700">{supportLevel}</span>
          </p>
        </div>

        <button
          onClick={() => {
            if (companies.length === 0) {
              alert('No businesses onboarded yet.');
              return;
            }
            setSelectedCompId(companies[0].id);
            setShowNewTicketModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open Support Case</span>
        </button>
      </div>

      {/* Grid: Tickets and Merchant Assistance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Tickets */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Merchant Support Cases</h3>
            <span className="text-xs text-slate-400 font-semibold">{tickets.length} Active Tickets</span>
          </div>

          {tickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No support cases open right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((tkt) => (
                <div key={tkt.id} className="p-4 hover:bg-slate-50/60 transition-colors text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{tkt.subject}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                      {tkt.ticketNumber}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Store: <span className="font-semibold text-slate-800">{tkt.companyName}</span> ({tkt.merchantMobile})
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {tkt.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tkt.status}
                    </span>
                    <span className="text-slate-400 text-[10px]">Assigned: {tkt.assignedToName || 'Queue'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Merchant Login Assistance (L3/L4) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Merchant Account Assistance</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              L3/L4 support agents can assist merchants locked out of accounts.
            </p>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {users.map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{m.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">@{m.username} • {m.mobile}</div>
                <button
                  onClick={() => handleAssistedPasswordReset(m)}
                  className="mt-1.5 w-full py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 font-bold rounded-lg text-[11px] transition-colors"
                >
                  Generate Temp Password
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal to create support ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 border border-slate-200 text-xs">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Support Case</h3>
              <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 font-bold p-1 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Business</label>
                  <select
                    value={selectedCompId}
                    onChange={(e) => setSelectedCompId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Issue Summary</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Printer connection / GST calculation query"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="TECHNICAL">Technical Issues</option>
                    <option value="BILLING">POS Billing & GST</option>
                    <option value="LOGIN">Login & Credentials</option>
                    <option value="SUBSCRIPTION">Plan & Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Notes</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
