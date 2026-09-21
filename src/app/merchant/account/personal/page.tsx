'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore } from '@/lib/store/localStore';
import { User } from '@/types';
import {
  User as UserIcon,
  ShieldCheck,
  Key,
  Save,
  CheckCircle,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

export default function MerchantPersonalDetailsPage() {
  const { user, refreshTenant } = useAuth();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveUser(updatedUser, password.trim() ? password.trim() : undefined);
    refreshTenant();
    setSaved(true);
    setPassword('');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserIcon className="w-6 h-6 text-purple-600" />
          <span>Personal Details</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal merchant owner profile, contact information, and security credentials
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Personal profile and security updated successfully!</span>
        </div>
      )}

      {/* Identity Pill Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
          {(name || 'M').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-base font-extrabold text-slate-900 truncate">{name || 'Merchant Owner'}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="font-mono text-purple-700 font-bold">@{user?.username || 'merchant'}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              MERCHANT ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Number *</span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Change Account Password (Optional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (leave empty to keep current password)"
              className="w-full sm:w-2/3 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Personal Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
