'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { localStore } from '@/lib/store/localStore';
import { SAAS_FEATURES, SaaSFeature } from '@/lib/presets/plans';
import { SubscriptionPlan, PlanId, ModuleKey } from '@/types';
import { cloudSync } from '@/lib/firebase/cloudSync';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Receipt,
  FileText,
  Printer,
  Boxes,
  Users,
  Undo2,
  BookOpen,
  ShieldCheck,
  FileCheck,
  Layers,
  FileSpreadsheet,
  QrCode,
  Percent,
  Headphones,
  Store,
  Shield,
  Zap,
  ArrowRight,
  Info,
  Flame,
  Download,
  RefreshCw,
  Phone,
  Cloud,
  CheckSquare,
  Square,
  Database,
} from 'lucide-react';

// The 16 Features arranged in 2 columns matching Image 1
const FEATURE_COLUMN_1 = [
  { id: 'billing_invoice', label: 'Billing & Invoice' },
  { id: 'thermal_bill_58mm', label: '58mm Thermal Bill' },
  { id: 'customer_master', label: 'Customer Master List' },
  { id: 'sundry_khatabook', label: 'Sundry Khatabook (Dues)' },
  { id: 'stock_challan', label: 'Stock Challan' },
  { id: 'reports_export', label: 'Reports & Export' },
  { id: 'upi_qr_bill', label: 'UPI QR on Bill' },
  { id: 'gst_tax_calc', label: 'GST Tax Calculation' },
];

const FEATURE_COLUMN_2 = [
  { id: 'a4_smart_invoice', label: 'A4 Smart Invoice' },
  { id: 'stock_inventory', label: 'Stock / Inventory' },
  { id: 'sold_item_return', label: 'Sold Item Return' },
  { id: 'collection_agent', label: 'Collection Agent' },
  { id: 'invoice_draft', label: 'Invoice Draft' },
  { id: 'excel_import_export', label: 'Excel Import / Export' },
  { id: 'counter_staff_roles', label: 'Counter Staff & Roles' },
  { id: 'support_ticket_desk', label: 'Support Ticket Desk' },
];

const ALL_16_FEATURE_IDS = [
  ...FEATURE_COLUMN_1.map((f) => f.id),
  ...FEATURE_COLUMN_2.map((f) => f.id),
];

export default function PlansAndPricingMasterPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloud Sync Status
  const [fbConnected, setFbConnected] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Database Connection Required Modal
  const [showDbRequiredModal, setShowDbRequiredModal] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formPlanId, setFormPlanId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formValidityDays, setFormValidityDays] = useState<number>(30);
  const [formPlanType, setFormPlanType] = useState<'paid' | 'free' | 'trial' | 'custom'>('paid');
  const [formDescription, setFormDescription] = useState('');

  // Limits (Image 2)
  const [formMaxProducts, setFormMaxProducts] = useState<number>(50);
  const [formIsUnlimitedProducts, setFormIsUnlimitedProducts] = useState(false);
  const [formMaxEmployees, setFormMaxEmployees] = useState<number>(1);
  const [formMaxCustomers, setFormMaxCustomers] = useState<number>(100);
  const [formIsUnlimitedCustomers, setFormIsUnlimitedCustomers] = useState(false);
  const [formMaxBranches, setFormMaxBranches] = useState<number>(1);

  // Special Add-ons (Image 2)
  const [formAiAssistant, setFormAiAssistant] = useState(false);
  const [formWhatsappInvoicing, setFormWhatsappInvoicing] = useState(false);

  // Feature Bundle Checkboxes (Image 1)
  const [formIncludedFeatureIds, setFormIncludedFeatureIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<SubscriptionPlan | null>(null);

  const loadData = () => {
    const data = localStore.getPlans();
    setPlans(data);
    const fbCfg = localStore.getFirebaseCloudConfig();
    setFbConnected(!!fbCfg.connected);
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Auto-restore all data from database to website when Firebase is connected
  useEffect(() => {
    const fbCfg = localStore.getFirebaseCloudConfig();
    if (fbCfg.connected && fbCfg.projectId) {
      setIsCloudSyncing(true);
      cloudSync
        .pullAll(fbCfg)
        .then((res) => {
          if (res.success && res.data) {
            localStore.restoreFromFirebase(res.data);
            setPlans(localStore.getPlans());
          }
        })
        .catch((err) => console.warn('Cloud restore error:', err))
        .finally(() => setIsCloudSyncing(false));
    }
  }, [fbConnected]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Open Create Modal (Checks Firebase Connection)
  const handleOpenCreateModal = () => {
    if (!fbConnected) {
      setShowDbRequiredModal(true);
      return;
    }

    setModalMode('create');
    setFormPlanId('plan_' + Date.now());
    setFormName('');
    setFormPrice(0);
    setFormValidityDays(30);
    setFormPlanType('paid');
    setFormDescription('');
    setFormMaxProducts(50);
    setFormIsUnlimitedProducts(false);
    setFormMaxEmployees(1);
    setFormMaxCustomers(100);
    setFormIsUnlimitedCustomers(false);
    setFormMaxBranches(1);
    setFormAiAssistant(false);
    setFormWhatsappInvoicing(false);
    setFormIncludedFeatureIds([
      'billing_invoice',
      'a4_smart_invoice',
      'thermal_bill_58mm',
      'stock_inventory',
      'customer_master',
      'gst_tax_calc',
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: SubscriptionPlan) => {
    setModalMode('edit');
    setFormPlanId(plan.id);
    setFormName(plan.name);
    setFormPrice(plan.price !== undefined ? plan.price : plan.priceMonthly || 0);
    setFormValidityDays(plan.validityDays || 365);
    setFormPlanType(plan.planType || (plan.price === 0 || plan.priceMonthly === 0 ? 'free' : 'paid'));
    setFormDescription(plan.description || '');

    const isUnlimProd =
      plan.limits?.isUnlimitedProducts ??
      (plan.limits?.maxProducts >= 99999);
    setFormIsUnlimitedProducts(isUnlimProd);
    setFormMaxProducts(isUnlimProd ? 100000 : plan.limits?.maxProducts || 50);

    const isUnlimCust =
      plan.limits?.isUnlimitedCustomers ??
      (plan.limits?.maxCustomers >= 99999);
    setFormIsUnlimitedCustomers(isUnlimCust);
    setFormMaxCustomers(isUnlimCust ? 100000 : plan.limits?.maxCustomers || 100);

    setFormMaxEmployees(plan.limits?.maxEmployees || 1);
    setFormMaxBranches(plan.limits?.maxBranches || 1);

    setFormAiAssistant(!!plan.limits?.aiAssistant);
    setFormWhatsappInvoicing(!!plan.limits?.whatsappAlerts);

    if (plan.includedFeatureIds && plan.includedFeatureIds.length > 0) {
      setFormIncludedFeatureIds([...plan.includedFeatureIds]);
    } else {
      setFormIncludedFeatureIds([...ALL_16_FEATURE_IDS]);
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Feature Checkbox
  const handleToggleFeature = (featureId: string) => {
    setFormIncludedFeatureIds((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  // Select all 16 features
  const handleSelectAllFeatures = () => {
    setFormIncludedFeatureIds([...ALL_16_FEATURE_IDS]);
  };

  // Clear all features
  const handleClearAllFeatures = () => {
    setFormIncludedFeatureIds([]);
  };

  // Save Plan
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fbConnected) {
      setIsModalOpen(false);
      setShowDbRequiredModal(true);
      return;
    }

    if (!formName.trim()) {
      setFormError('Plan Name is required.');
      return;
    }

    const priceNum = Number(formPrice) || 0;
    const validityNum = Number(formValidityDays) || 30;

    const featureNames = formIncludedFeatureIds.map((id) => {
      const col1Match = FEATURE_COLUMN_1.find((f) => f.id === id);
      if (col1Match) return col1Match.label;
      const col2Match = FEATURE_COLUMN_2.find((f) => f.id === id);
      if (col2Match) return col2Match.label;
      return id;
    });

    const autoModules: ModuleKey[] = ['billing'];
    if (formIncludedFeatureIds.includes('stock_inventory') || formIncludedFeatureIds.includes('stock_challan')) {
      autoModules.push('inventory');
    }
    if (formIncludedFeatureIds.includes('customer_master') || formIncludedFeatureIds.includes('sundry_khatabook')) {
      autoModules.push('customers');
    }
    if (formIncludedFeatureIds.includes('reports_export')) {
      autoModules.push('reports');
    }
    if (formIncludedFeatureIds.includes('gst_tax_calc')) {
      autoModules.push('gst');
    }
    if (formIncludedFeatureIds.includes('counter_staff_roles') || formIncludedFeatureIds.includes('collection_agent')) {
      autoModules.push('employees');
    }
    if (formAiAssistant) autoModules.push('ai');
    if (formWhatsappInvoicing) autoModules.push('whatsapp');

    const finalPlanId: PlanId =
      modalMode === 'edit'
        ? (formPlanId as PlanId)
        : (formName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') as PlanId);

    const savedPlan: SubscriptionPlan = {
      id: finalPlanId,
      name: formName.trim(),
      price: priceNum,
      priceMonthly: priceNum,
      priceYearly: priceNum,
      validityDays: validityNum,
      planType: formPlanType,
      description: formDescription.trim(),
      features: featureNames,
      includedFeatureIds: formIncludedFeatureIds,
      autoEnabledModules: autoModules,
      limits: {
        maxProducts: formIsUnlimitedProducts ? 999999 : Number(formMaxProducts) || 50,
        isUnlimitedProducts: formIsUnlimitedProducts,
        maxEmployees: Number(formMaxEmployees) || 1,
        maxCustomers: formIsUnlimitedCustomers ? 999999 : Number(formMaxCustomers) || 100,
        isUnlimitedCustomers: formIsUnlimitedCustomers,
        maxSuppliers: 50,
        maxInvoicesPerMonth: 5000,
        maxBranches: Number(formMaxBranches) || 1,
        aiAssistant: formAiAssistant,
        whatsappAlerts: formWhatsappInvoicing,
        advancedReports: formIncludedFeatureIds.includes('reports_export'),
        storageMb: 1024,
      },
    };

    localStore.savePlan(savedPlan);
    setIsModalOpen(false);
    loadData();

    showToast(
      modalMode === 'create'
        ? `Subscription plan '${savedPlan.name}' created and saved to Firebase.`
        : `Subscription plan '${savedPlan.name}' updated successfully.`
    );
  };

  // Delete Plan permanently
  const handleConfirmDelete = () => {
    if (!deleteTargetPlan) return;
    const planName = deleteTargetPlan.name;
    localStore.deletePlan(deleteTargetPlan.id);
    setDeleteTargetPlan(null);
    loadData();
    showToast(`Plan '${planName}' permanently deleted from website and Firebase.`);
  };

  // Pull / Sync from Firebase Cloud
  const handlePullFromFirebase = async () => {
    const fbCfg = localStore.getFirebaseCloudConfig();
    if (!fbCfg.connected) {
      setShowDbRequiredModal(true);
      return;
    }

    setIsCloudSyncing(true);
    try {
      const res = await cloudSync.pullAll(fbCfg);
      if (res.success && res.data) {
        localStore.restoreFromFirebase(res.data);
        loadData();
        showToast('Successfully synchronized all subscription plans from Firebase Realtime Database.');
      } else {
        showToast(res.message || 'Unable to fetch plans from Firebase.');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error fetching data from Firebase.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
    );
  }, [plans, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* TOP HEADER (Neat and clean, no clutter, no subtitle)          */}
      {/* ============================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Plans &amp; Pricing
          </h1>
          <div className="mt-0.5">
            <h2 className="text-sm font-bold text-slate-700">
              Plan &amp; Feature Bundles
            </h2>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Firebase Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              fbConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                fbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{fbConnected ? 'Firebase Live Sync' : 'Database Offline'}</span>
          </div>

          {/* Sync with Cloud Button */}
          {fbConnected && (
            <button
              type="button"
              onClick={handlePullFromFirebase}
              disabled={isCloudSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Pull plans from Firebase Realtime Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isCloudSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
          )}

          {/* + New Plan Button (Checks Firebase Connection) */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Plan</span>
          </button>
        </div>
      </div>

      {/* Search and Active Counter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plans by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <span>Active Plans:</span>
          <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {filteredPlans.length}
          </span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4-TIER PLAN CARDS GRID                                        */}
      {/* ============================================================= */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No subscription plans found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {fbConnected
              ? "Your cloud database currently has no plan cards. Click '+ New Plan' to create and sync your custom subscription tiers."
              : 'Connect your Firebase database setup first. Once connected, your plan cards will automatically synchronize and restore.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {!fbConnected ? (
              <button
                type="button"
                onClick={() => router.push('/superadmin/settings?tab=firebase')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Connect Firebase Database</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Plan</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPlans.map((plan) => {
            const price = plan.price !== undefined ? plan.price : plan.priceMonthly || 0;
            const validityDays = plan.validityDays || 365;
            const isFree = plan.planType === 'free' || price === 0;
            const includedCount = plan.includedFeatureIds?.length || plan.features?.length || 0;

            const isUnlimProd =
              plan.limits?.isUnlimitedProducts ??
              (plan.limits?.maxProducts >= 99999);
            const isUnlimCust =
              plan.limits?.isUnlimitedCustomers ??
              (plan.limits?.maxCustomers >= 99999);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Row: Title + Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {plan.name}
                      </h3>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                          isFree
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {isFree ? 'Free' : 'Paid'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-mono">
                        ₹ {price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {validityDays} Days Validity
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                      {plan.description}
                    </p>
                  )}

                  {/* Limits Summary Container */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-[11px]">Products:</span>
                      <span className="font-bold text-slate-900">
                        {isUnlimProd ? (
                          <span className="text-indigo-600 font-black">Unlimited</span>
                        ) : (
                          `${plan.limits?.maxProducts || 50} Items`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-[11px]">Customers:</span>
                      <span className="font-bold text-slate-900">
                        {isUnlimCust ? (
                          <span className="text-indigo-600 font-black">Unlimited</span>
                        ) : (
                          `${plan.limits?.maxCustomers || 100} Khata`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-[11px]">Staff Logins:</span>
                      <span className="font-bold text-slate-900">
                        {plan.limits?.maxEmployees || 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-[11px]">Branch Outlets:</span>
                      <span className="font-bold text-slate-900">
                        {plan.limits?.maxBranches || 1}
                      </span>
                    </div>
                  </div>

                  {/* Special Add-on Badges */}
                  {(plan.limits?.aiAssistant || plan.limits?.whatsappAlerts) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {plan.limits?.aiAssistant && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>AI Copilot</span>
                        </span>
                      )}
                      {plan.limits?.whatsappAlerts && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Receipt className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp Invoicing</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Features List with Pill Counter */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Features Enabled
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {includedCount}/16
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      {ALL_16_FEATURE_IDS.filter((id) =>
                        (plan.includedFeatureIds || []).includes(id)
                      )
                        .slice(0, 5)
                        .map((fId) => {
                          const col1 = FEATURE_COLUMN_1.find((f) => f.id === fId);
                          const col2 = FEATURE_COLUMN_2.find((f) => f.id === fId);
                          const label = col1?.label || col2?.label || fId;
                          return (
                            <div key={fId} className="flex items-center gap-1.5 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{label}</span>
                            </div>
                          );
                        })}

                      {includedCount > 5 && (
                        <div className="text-[11px] font-bold text-indigo-600 pt-0.5">
                          +{includedCount - 5} more features
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Edit + Delete Actions */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetPlan(plan)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 transition-colors shadow-2xs cursor-pointer"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================= */}
      {/* POPUP: DATABASE CONNECTION REQUIRED MODAL                    */}
      {/* ============================================================= */}
      {showDbRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-amber-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-amber-600" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Database Connection Required</h3>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                Please connect database setup after setup can create card.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero-Data-Loss Cloud Storage</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Connecting Firebase Realtime Database allows you to create, edit, and safely sync subscription plans and feature bundles across devices.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowDbRequiredModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDbRequiredModal(false);
                  router.push('/superadmin/settings?tab=firebase');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Connect Database Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CREATE & EDIT PLAN MODAL (Images 1 & 2)                       */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 my-auto flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {modalMode === 'create' ? 'Create New Plan' : 'Edit Plan'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure plan pricing, validity, limits and feature access bundle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Error */}
            {formError && (
              <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-4 sm:p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Row 1: Plan Name, Price, Validity, Plan Type */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    PLAN NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Standard"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    PRICE (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    VALIDITY (DAYS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formValidityDays}
                    onChange={(e) => setFormValidityDays(Number(e.target.value))}
                    placeholder="365"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    PLAN TYPE
                  </label>
                  <select
                    value={formPlanType}
                    onChange={(e) => setFormPlanType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="paid">Paid plan</option>
                    <option value="free">Free plan</option>
                    <option value="trial">Trial plan</option>
                    <option value="custom">Custom plan</option>
                  </select>
                </div>
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="For growing retail stores requiring barcode billing, dues khata and stock tracking"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
                />
              </div>

              {/* Limits Section (Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                {/* Products Limit + Unlimited Checkbox */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Products Limit
                    </label>
                    <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsUnlimitedProducts}
                        onChange={(e) => setFormIsUnlimitedProducts(e.target.checked)}
                        className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Unlimited</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={formIsUnlimitedProducts}
                    value={formIsUnlimitedProducts ? 999999 : formMaxProducts}
                    onChange={(e) => setFormMaxProducts(Number(e.target.value))}
                    className="w-full p-2 bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Staff Logins */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    Staff Logins
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxEmployees}
                    onChange={(e) => setFormMaxEmployees(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Customers Limit + Unlimited Checkbox */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Customers Limit
                    </label>
                    <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsUnlimitedCustomers}
                        onChange={(e) => setFormIsUnlimitedCustomers(e.target.checked)}
                        className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Unlimited</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={formIsUnlimitedCustomers}
                    value={formIsUnlimitedCustomers ? 999999 : formMaxCustomers}
                    onChange={(e) => setFormMaxCustomers(Number(e.target.value))}
                    className="w-full p-2 bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Branch Outlets */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    Branch Outlets
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxBranches}
                    onChange={(e) => setFormMaxBranches(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Special Add-on Cards (Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    formAiAssistant
                      ? 'bg-purple-50/50 border-purple-300 text-purple-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900">VypaarMitra AI Assistant</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Natural language voice &amp; chat copilot
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAiAssistant}
                    onChange={(e) => setFormAiAssistant(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer mt-1"
                  />
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    formWhatsappInvoicing
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900">WhatsApp &amp; SMS Invoicing</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Direct bill PDF dispatch to customer phones
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formWhatsappInvoicing}
                    onChange={(e) => setFormWhatsappInvoicing(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer mt-1"
                  />
                </label>
              </div>

              {/* Feature Bundle Section (Image 1) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    FEATURE BUNDLE - {formIncludedFeatureIds.length}/16 ENABLED
                  </span>
                  <div className="space-x-3 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFeatures}
                      className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllFeatures}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 2 Columns Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    {FEATURE_COLUMN_1.map((item) => {
                      const isChecked = formIncludedFeatureIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/40 border-indigo-300 text-slate-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFeature(item.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2">
                    {FEATURE_COLUMN_2.map((item) => {
                      const isChecked = formIncludedFeatureIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/40 border-indigo-300 text-slate-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFeature(item.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer text-xs"
                >
                  {modalMode === 'create' ? 'Save plan' : 'Update plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Subscription Plan?</h3>
                <p className="text-xs text-slate-500">Zero-data-loss cloud permanent delete</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">'{deleteTargetPlan.name}'</strong>?
              This will remove the plan from this device and permanently purge it from Firebase Realtime Database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetPlan(null)}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
