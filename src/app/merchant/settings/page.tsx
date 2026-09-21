'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Company, User } from '@/types';
import { getDisplayShopType } from '@/components/merchant/MerchantSidebar';
import {
  Settings2,
  UserCircle,
  Headphones,
  Store,
  Building,
  CheckCircle,
  Save,
  Phone,
  MessageSquare,
  Send,
  Key,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export default function MerchantSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Default to business setup if tab is empty or 'business'
  const activeTab = tabParam === 'profile' ? 'profile' : tabParam === 'support' ? 'support' : 'business';

  const { company, user, refreshTenant } = useAuth();
  const companyId = company?.id || user?.companyId || '';

  // Business Setup state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceTerms, setInvoiceTerms] = useState('Goods once sold will not be taken back.');
  const [customShopType, setCustomShopType] = useState('');
  const [saved, setSaved] = useState(false);

  // Profile tab state
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Support tab state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setMobile(company.mobile);
      setEmail(company.email);
      setGstin(company.gstin || '');
      setAddress(company.address);
      setCity(company.city);
      setState(company.state);
      setPincode(company.pincode);
      setInvoicePrefix(company.invoicePrefix);
      setInvoiceTerms(company.invoiceTerms || 'Goods once sold will not be taken back.');
      setCustomShopType(company.customBusinessTypeName || '');
    }
    if (user) {
      setOwnerName(user.name);
      setOwnerMobile(user.mobile);
      setOwnerEmail(user.email);
    }
  }, [company, user]);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const updated: Company = {
      ...company,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      invoicePrefix: invoicePrefix.trim().toUpperCase(),
      invoiceTerms: invoiceTerms.trim(),
      customBusinessTypeName: customShopType.trim() || company.customBusinessTypeName,
      updatedAt: new Date().toISOString(),
    };

    localStore.saveCompany(updated);
    refreshTenant();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name: ownerName.trim(),
      mobile: ownerMobile.trim(),
      email: ownerEmail.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveUser(updatedUser, newPassword.trim() ? newPassword.trim() : undefined);
    refreshTenant();
    setProfileSaved(true);
    setNewPassword('');
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;

    const ticketId = `ticket_${Date.now()}`;
    localStore.saveSupportTicket({
      id: ticketId,
      ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      companyId,
      companyName: company?.name || 'Merchant Store',
      merchantName: user?.name || 'Store Owner',
      merchantMobile: user?.mobile || company?.mobile || '',
      subject: ticketSubject.trim(),
      category: 'TECHNICAL',
      priority: 'HIGH',
      status: 'OPEN',
      supportLevelRequired: 'L1',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user?.id || 'merchant_owner',
          senderName: user?.name || 'Store Owner',
          senderRole: 'MERCHANT',
          text: ticketMessage.trim() || ticketSubject.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 3000);
  };

  const displayShopType = getDisplayShopType(company);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Tabs */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {activeTab === 'profile'
            ? 'Owner Profile'
            : activeTab === 'support'
            ? 'Merchant Support Desk'
            : 'Business Setup'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {activeTab === 'profile'
            ? 'Manage your personal merchant administrator account and security credentials'
            : activeTab === 'support'
            ? 'Get immediate support from NPB Media team via phone, WhatsApp or support ticket'
            : 'Configure your shop identity, human-readable shop type, GSTIN and invoice preferences'}
        </p>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => router.push('/merchant/settings?tab=business')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'business'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Business Setup</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/merchant/settings?tab=profile')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/merchant/settings?tab=support')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Supports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BUSINESS SETUP */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Business setup updated successfully!</span>
            </div>
          )}

          {/* Shop Type Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Shop Type</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Shop Type : <span className="text-blue-700">{displayShopType}</span></span>
              </div>
            </div>
            <div className="text-xs text-slate-500 max-w-xs">
              Configured during merchant registration. Catalog units and default GST rates adapt automatically.
            </div>
          </div>

          <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Firm Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Acme Software Services"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Shop Type Label</label>
                <input
                  type="text"
                  value={customShopType}
                  onChange={(e) => setCustomShopType(e.target.value)}
                  placeholder="e.g. Software services"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Mobile / WhatsApp *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN (for Tax Invoices)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Prefix (e.g. INV, BILL)</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Store Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop / Office address..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Terms & Conditions</label>
              <input
                type="text"
                value={invoiceTerms}
                onChange={(e) => setInvoiceTerms(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Setup</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          {profileSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Owner profile updated successfully!</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {(user?.name || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{user?.name || 'Merchant Owner'}</div>
              <div className="text-xs text-slate-500">@{user?.username || 'merchant'} • Role: <span className="font-bold text-blue-700">MERCHANT ADMIN</span></div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Update Password (leave blank to keep current)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password..."
                className="w-full sm:w-1/2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SUPPORTS */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="tel:+918877300114"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col items-center text-center gap-1.5 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Call Helpline</div>
              <div className="text-xs font-mono font-bold text-blue-700">+91 8877300114</div>
              <div className="text-[10px] text-slate-400">9:00 AM - 8:00 PM</div>
            </a>

            <a
              href="https://wa.me/918877300114?text=Hello%20VypaarMitra%20Support,%20I%20need%20assistance%20with%20my%20merchant%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col items-center text-center gap-1.5 group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">WhatsApp Support</div>
              <div className="text-xs font-bold text-emerald-700">Chat Instantly</div>
              <div className="text-[10px] text-slate-400">24x7 Priority Support</div>
            </a>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Technical Support</div>
              <div className="text-xs font-bold text-purple-700">NPB Media Desk</div>
              <div className="text-[10px] text-slate-400">Patna, Bihar & All-India</div>
            </div>
          </div>

          {/* Ticket Submission Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Submit a Support Request</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Our support engineering team will review your query and contact your registered mobile.
              </p>
            </div>

            {ticketSent ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm text-slate-900">Support Ticket Created Successfully!</div>
                <p className="text-xs text-slate-600">
                  Ticket reference has been logged. Our technical executive will call you at {company?.mobile || user?.mobile || 'your mobile'} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Subject *</label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                    placeholder="e.g. Printer thermal formatting or GST report calculation"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Please explain the issue or what you need help with..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
