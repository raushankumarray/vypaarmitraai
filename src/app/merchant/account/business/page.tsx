'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { Company } from '@/types';
import { getDisplayShopType } from '@/components/merchant/MerchantSidebar';
import {
  Building2,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle,
  Save,
  Store,
  FileText,
  Sliders,
  Eye,
} from 'lucide-react';

export default function MerchantBusinessDetailsPage() {
  const { company, refreshTenant } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [customShopType, setCustomShopType] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [headerDisplayMode, setHeaderDisplayMode] = useState<'BOTH' | 'LOGO_ONLY' | 'NAME_ONLY'>('BOTH');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceTerms, setInvoiceTerms] = useState('Goods once sold will not be taken back.');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setCustomShopType(company.customBusinessTypeName || '');
      setLogoUrl(company.logoUrl || '');
      setHeaderDisplayMode(company.headerDisplayMode || 'BOTH');
      setMobile(company.mobile || '');
      setEmail(company.email || '');
      setGstin(company.gstin || '');
      setAddress(company.address || '');
      setCity(company.city || '');
      setState(company.state || '');
      setPincode(company.pincode || '');
      setInvoicePrefix(company.invoicePrefix || 'INV');
      setInvoiceTerms(company.invoiceTerms || 'Goods once sold will not be taken back.');
    }
  }, [company]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setLogoUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const updated: Company = {
      ...company,
      name: name.trim(),
      customBusinessTypeName: customShopType.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      headerDisplayMode,
      mobile: mobile.trim(),
      email: email.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      invoicePrefix: invoicePrefix.trim().toUpperCase(),
      invoiceTerms: invoiceTerms.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveCompany(updated);
    refreshTenant();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const displayShopType = getDisplayShopType(company);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-blue-600" />
          <span>Business Details & Branding</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your business identity, store logo, mobile header view, and printed invoice headers
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Business details and logo preferences saved successfully!</span>
        </div>
      )}

      {/* 1. Store Logo & Header Display Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>Business Logo & Header Display Preference</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your own business logo for website header and printed POS bills
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Uploader */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Official Store Logo</label>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 p-1 flex items-center justify-center bg-slate-50 relative overflow-hidden flex-shrink-0 group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center p-2">
                    <img src="/logo.png" alt="Default Logo" className="w-8 h-8 object-contain mx-auto opacity-40" />
                    <span className="text-[9px] font-bold text-slate-400 block mt-1">Default Logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Logo</span>
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400">
                  PNG, JPG or WebP up to 2MB. If deleted, default logo is used.
                </p>
              </div>
            </div>
          </div>

          {/* Header Display Preference */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Mobile Header Display Mode</span>
            </label>

            <div className="space-y-2">
              {[
                { id: 'BOTH', title: 'Both Logo & Business Name', desc: 'Display uploaded/default logo with firm name' },
                { id: 'LOGO_ONLY', title: 'Logo Only', desc: 'Display only the store logo icon in header' },
                { id: 'NAME_ONLY', title: 'Business Name Only', desc: 'Display only text firm name without logo' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    headerDisplayMode === opt.id
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="headerDisplayMode"
                    value={opt.id}
                    checked={headerDisplayMode === opt.id}
                    onChange={(e) => setHeaderDisplayMode(e.target.value as any)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{opt.title}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Business Information Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Shop Type Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Shop Type</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Shop Type : <span className="text-blue-700">{displayShopType}</span></span>
              </div>
            </div>
            <div className="text-xs text-slate-500 max-w-xs">
              Configured during registration. Unit choices, barcode billing and GST tax rates adapt accordingly.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Firm Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Custom Shop Type Name</label>
              <input
                type="text"
                value={customShopType}
                onChange={(e) => setCustomShopType(e.target.value)}
                placeholder="e.g. Software services / Retail Store"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Mobile / WhatsApp *</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN (For Tax Invoices)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="07AAAAA0000A1Z5"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Prefix (e.g. INV, BILL)</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Physical Store Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No., Market / Complex name, Road"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Terms & Conditions</label>
            <input
              type="text"
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
