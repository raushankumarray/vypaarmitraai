'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Receipt,
  Package,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { BrandName } from '@/components/common/BrandName';

const FEATURES = [
  {
    icon: Receipt,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    title: 'Smart Billing & POS',
    description: 'Create invoices, manage customers and make billing faster.',
  },
  {
    icon: Package,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Inventory & Stock',
    description: 'Track products, stock levels, purchases and stock movements in real time.',
  },
  {
    icon: ShoppingCart,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    title: 'Sales & Purchase',
    description: 'Manage sales, purchases, returns and supplier transactions from one place.',
  },
  {
    icon: BarChart3,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'Reports & Business Insights',
    description: 'Get clear business reports and insights to understand your sales, inventory and performance.',
  },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter both your identifier (username/email/mobile) and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between overflow-x-hidden lg:overflow-hidden relative select-none font-sans">
      {/* ------------------------------------------------------------- */}
      {/* SUBTLE ENTERPRISE BACKGROUND EFFECTS */}
      {/* ------------------------------------------------------------- */}
      {/* Ambient Top Left Glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Ambient Bottom Right Glow */}
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Subtle Grid Matrix Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20 sm:pb-24 lg:py-6 flex items-center justify-center min-h-0 relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ========================================================= */}
          {/* LEFT SIDE: BRAND INTRODUCTION & BUSINESS FEATURES (~55%) */}
          {/* (Hidden on Mobile, Visible on Desktop lg+)                */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-4 lg:space-y-5">
            {/* Logo */}
            <div className="h-10 sm:h-12 flex items-center">
              <img
                src="/logo.png"
                alt="VypaarMitra AI"
                className="h-full w-auto object-contain drop-shadow-sm"
              />
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-white tracking-tight leading-tight">
                Run Your Business Smarter
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-300">with</span>
                <BrandName size="2xl" theme="dark" />
              </div>
            </div>

            {/* Supporting Text */}
            <div className="space-y-1 text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
              <p className="text-slate-300 font-medium">
                A complete cloud business management platform designed for Retail, Distribution &amp; Enterprise businesses.
              </p>
              <p className="text-slate-400 text-xs font-semibold">
                Manage your business. Track your growth. Work smarter.
              </p>
            </div>

            {/* 4 Feature Blocks / Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {FEATURES.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-start gap-3 group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5 ${feat.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h2 className="text-xs font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                        {feat.title}
                      </h2>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NPB Media Parent Branding */}
            <div className="pt-2 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="font-bold text-slate-300 tracking-wide">NPB Media</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: MODERN LOGIN CARD (~45%)                      */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center w-full">
            {/* Mobile-only Centered Brand Logo */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <img
                src="/logo.png"
                alt="VypaarMitra AI"
                className="h-12 w-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="w-full max-w-md bg-[#0d1424]/90 backdrop-blur-2xl rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
              {/* Top Subtle Gradient Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-90" />

              {/* Card Heading */}
              <div className="mb-5 pb-3.5 border-b border-slate-800/80">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in to access your workspace
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field 1: Username / Email / Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Enter Email ID / Mobile No.
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter Username"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Enter Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Below Password Align Right Notice */}
                  <div className="flex justify-end mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium hover:text-slate-300 transition-colors">
                      Multi-Tenant Protected
                    </span>
                  </div>
                </div>

                {/* Primary Button: Sign In Securely */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-[0.99] shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In Securely</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* ----------------------------------------------------- */}
              {/* SECURITY INFORMATION */}
              {/* ----------------------------------------------------- */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure Business Access</span>
                </div>
                <p className="text-[10.5px]">
                  Your workspace and business data are protected with secure authentication.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                  <p>New business onboarding is managed by NPB Media.</p>
                  <p>Public merchant signup is not available.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER (Fixed at page bottom in mobile mode, static on desktop) */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full fixed bottom-0 left-0 right-0 lg:static border-t border-slate-800/80 bg-[#060a14]/95 backdrop-blur-md py-2.5 px-4 sm:px-6 z-20 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-1.5 text-center sm:text-left shadow-lg lg:shadow-none">
        <div>
          &copy; 2026 NPB Media. All rights reserved.
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          VypaarMitra AI Production Gateway
        </div>
      </footer>
    </div>
  );
}
