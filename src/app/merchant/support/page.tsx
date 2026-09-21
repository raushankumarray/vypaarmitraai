'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { SupportTicket } from '@/types';
import {
  Headphones,
  Phone,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle,
  Clock,
  HelpCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function MerchantSupportPage() {
  const { company, user } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'TECHNICAL' | 'BILLING' | 'SUBSCRIPTION' | 'FEATURE_REQUEST'>('TECHNICAL');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const loadTickets = () => {
    if (!companyId) return;
    setTickets(localStore.getSupportTickets(companyId));
  };

  useEffect(() => {
    loadTickets();
    const unsub = localStore.subscribe(() => loadTickets());
    return () => unsub();
  }, [companyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const ticketId = `ticket_${Date.now()}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId,
      companyName: company?.name || 'Merchant Store',
      merchantName: user?.name || 'Store Owner',
      merchantMobile: user?.mobile || company?.mobile || '',
      subject: subject.trim(),
      category,
      priority: 'HIGH',
      status: 'OPEN',
      supportLevelRequired: 'L1',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user?.id || 'merchant_owner',
          senderName: user?.name || 'Store Owner',
          senderRole: 'MERCHANT',
          text: message.trim() || subject.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveSupportTicket(newTicket);
    setSubmitted(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Headphones className="w-6 h-6 text-emerald-600" />
          <span>Merchant Support & Help Desk</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Dedicated 24/7 technical and billing assistance for your store powered by NPB Media
        </p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Call Helpline */}
        <a
          href="tel:+918877300114"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Call Helpline</div>
            <div className="text-sm font-black text-slate-900 font-mono mt-0.5">+91 8877300114</div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">Mon - Sat (9 AM - 8 PM)</div>
          </div>
        </a>

        {/* WhatsApp Priority */}
        <a
          href="https://wa.me/918877300114?text=Hello%20VypaarMitra%20Support,%20I%20need%20assistance%20with%20my%20merchant%20account."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Support</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">Instant 24x7 Chat</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Connect with Executive →</div>
          </div>
        </a>

        {/* Powered by NPB Media */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Engineered By</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">NPB Media</div>
            <div className="text-[10px] text-purple-600 font-bold mt-0.5">Enterprise Cloud SLA</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Raise Ticket Form & Open Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Raise Ticket Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Raise Support Ticket</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit your inquiry and our support team will contact you.
            </p>
          </div>

          {submitted && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Ticket logged successfully! We will contact you soon.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs flex-1 flex flex-col">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="TECHNICAL">Technical / POS Device</option>
                <option value="BILLING">Invoicing & Tax Calculation</option>
                <option value="SUBSCRIPTION">Account Validity / Renewal</option>
                <option value="FEATURE_REQUEST">Feature Suggestion</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. Need thermal printer margins configuration"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex-1">
              <label className="block font-bold text-slate-700 mb-1">Detailed Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your question or issue in detail..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>

        {/* Right: Ticket History & Status (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>My Support Tickets</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live status and history of raised requests</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {tickets.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px]">
            {tickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-600">No Support Tickets</div>
                <p>You have not logged any support tickets yet.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900">{t.subject}</div>

                  {t.messages?.[0]?.text && (
                    <p className="text-slate-600 text-[11px] line-clamp-2">{t.messages[0].text}</p>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Category: {t.category}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
