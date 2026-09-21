'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { localStore } from '@/lib/store/localStore';
import {
  Company,
  User,
  AccountStatus,
  PlanId,
  BusinessType,
  SubscriptionPlan,
} from '@/types';
import { PRESET_BUSINESS_TYPES } from '@/lib/presets/businessTypes';
import { PRESET_PLANS, SAAS_FEATURES } from '@/lib/presets/plans';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  FileText,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  ShieldCheck,
  Cloud,
  Database,
  Flame,
} from 'lucide-react';

export default function MerchantAccountManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>(PRESET_PLANS);
  const [allBusinessTypes, setAllBusinessTypes] = useState<BusinessType[]>(PRESET_BUSINESS_TYPES);

  // Filter & Search States
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [shopTypeFilter, setShopTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Last updated tracker
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal: Create or Manage
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDbRequiredModal, setShowDbRequiredModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetCompanyId, setTargetCompanyId] = useState<string | null>(null);

  // Form Fields (Matching Image 2)
  const [businessName, setBusinessName] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('kirana');
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Bihar');
  const [pinCode, setPinCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');

  // Merchant Panel Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Plan & Validity
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('STANDARD');
  const [accountValidUpto, setAccountValidUpto] = useState<string>('');
  const [sundryKhatabook, setSundryKhatabook] = useState<'ENABLED' | 'DISABLED'>('ENABLED');

  // Feature Bundle (16 features)
  const [enabledFeatureIds, setEnabledFeatureIds] = useState<string[]>([]);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  // Load Data from Local Store
  const loadData = () => {
    const comps = localStore.getAllCompanies();
    const usrs = localStore.getAllUsers();
    const plans = localStore.getPlans();
    const bTypes = localStore.getBusinessTypes();

    setCompanies(comps);
    setUsers(usrs);
    setAvailablePlans(plans.length > 0 ? plans : PRESET_PLANS);
    setAllBusinessTypes(bTypes.length > 0 ? bTypes : PRESET_BUSINESS_TYPES);

    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  useEffect(() => {
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
    }
    return () => unsub();
  }, [searchParams]);

  // Default validity date to +365 days
  const getDefaultValidityDate = (days = 365) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const fbCfg = localStore.getFirebaseCloudConfig();
    if (!fbCfg.connected) {
      setShowDbRequiredModal(true);
      return;
    }

    setIsEditing(false);
    setTargetCompanyId(null);
    setBusinessName('');
    setBusinessTypeId('kirana');
    setIsCustomType(false);
    setCustomTypeName('');
    setOwnerName('');
    setRegisteredPhone('');
    setEmail('');
    setShopAddress('');
    setCity('');
    setStateName('Bihar');
    setPinCode('');
    setGstin('');
    setInvoicePrefix('INV');
    setUsername('');
    setPassword('');
    setSelectedPlanId('STANDARD');
    setAccountValidUpto(getDefaultValidityDate(365));
    setSundryKhatabook('ENABLED');

    // Default 14 of 16 features for Standard plan
    const standardFeatures = SAAS_FEATURES.filter((f) => f.id !== 'collection_agent' && f.id !== 'counter_staff_roles').map((f) => f.id);
    setEnabledFeatureIds(standardFeatures);

    setIsModalOpen(true);
  };

  // Open Manage (Edit) Modal
  const handleOpenManage = (comp: Company) => {
    setIsEditing(true);
    setTargetCompanyId(comp.id);
    setBusinessName(comp.name);
    setBusinessTypeId(comp.businessTypeId);
    setIsCustomType(Boolean(comp.customBusinessTypeName));
    setCustomTypeName(comp.customBusinessTypeName || '');
    setOwnerName(comp.ownerName || '');
    setRegisteredPhone(comp.mobile || '');
    setEmail(comp.email || '');
    setShopAddress(comp.address || '');
    setCity(comp.city || '');
    setStateName(comp.state || 'Bihar');
    setPinCode(comp.pincode || '');
    setGstin(comp.gstin || '');
    setInvoicePrefix(comp.invoicePrefix || 'INV');

    // Find merchant user
    const merchantUser = users.find((u) => u.companyId === comp.id && u.role === 'MERCHANT');
    setUsername(merchantUser?.username || '');
    setPassword(''); // Leave blank if not changing

    setSelectedPlanId(comp.planId);
    setAccountValidUpto(comp.subscriptionExpiresAt ? comp.subscriptionExpiresAt.split('T')[0] : getDefaultValidityDate(365));
    setSundryKhatabook(comp.sundryKhatabookEnabled !== false ? 'ENABLED' : 'DISABLED');

    if (comp.enabledFeatureIds && comp.enabledFeatureIds.length > 0) {
      setEnabledFeatureIds(comp.enabledFeatureIds);
    } else {
      // Default to all 16 or plan default
      setEnabledFeatureIds(SAAS_FEATURES.map((f) => f.id));
    }

    setIsModalOpen(true);
  };

  // Plan Selection Sync
  const handlePlanChange = (planId: PlanId) => {
    setSelectedPlanId(planId);
    const plan = availablePlans.find((p) => p.id === planId);
    if (plan) {
      if (plan.validityDays) {
        setAccountValidUpto(getDefaultValidityDate(plan.validityDays));
      }
      if (plan.includedFeatureIds && plan.includedFeatureIds.length > 0) {
        setEnabledFeatureIds(plan.includedFeatureIds);
      }
    }
  };

  // Toggle Feature
  const toggleFeature = (fId: string) => {
    setEnabledFeatureIds((prev) =>
      prev.includes(fId) ? prev.filter((id) => id !== fId) : [...prev, fId]
    );
  };

  // Select all / Clear features
  const selectAllFeatures = () => setEnabledFeatureIds(SAAS_FEATURES.map((f) => f.id));
  const clearAllFeatures = () => setEnabledFeatureIds([]);

  // Save (Create or Update)
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const fbCfg = localStore.getFirebaseCloudConfig();
    if (!fbCfg.connected) {
      setIsModalOpen(false);
      setShowDbRequiredModal(true);
      return;
    }

    if (!businessName.trim()) {
      alert('Please enter Business / Shop Name.');
      return;
    }

    if (isCustomType && !customTypeName.trim()) {
      alert('Please enter a Custom Business / Shop Type name.');
      return;
    }

    if (!isEditing && (!username.trim() || !password.trim())) {
      alert('Please provide a Username and Password for the Merchant Login.');
      return;
    }

    const assignedType = isCustomType ? customTypeName.trim() : businessTypeId;

    // If custom business type, also save to businessTypes registry
    if (isCustomType) {
      const customId = `custom_${customTypeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const newCustomType: BusinessType = {
        id: customId,
        name: customTypeName.trim(),
        icon: 'Store',
        description: `Custom business profile for ${customTypeName.trim()}`,
        category: 'RETAIL',
        defaultModules: ['billing', 'inventory', 'customers', 'reports', 'gst'],
        defaultCategories: [customTypeName.trim(), 'General'],
        defaultUnits: ['PCS', 'BOX', 'PKT', 'KG', 'SET'],
        defaultTaxRate: 18,
        isSystem: false,
        customFields: [],
      };
      localStore.saveBusinessType(newCustomType);
    }

    const expiryIso = accountValidUpto ? new Date(accountValidUpto).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString();
    const isPastExpiry = new Date(expiryIso).getTime() < Date.now();

    if (isEditing && targetCompanyId) {
      const existing = localStore.getCompany(targetCompanyId);
      if (!existing) return;

      const updatedCompany: Company = {
        ...existing,
        name: businessName.trim(),
        businessTypeId: isCustomType ? `custom_${customTypeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}` : businessTypeId,
        customBusinessTypeName: isCustomType ? customTypeName.trim() : undefined,
        ownerName: ownerName.trim() || existing.ownerName,
        mobile: registeredPhone.trim(),
        email: email.trim(),
        address: shopAddress.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pinCode.trim(),
        gstin: gstin.trim(),
        invoicePrefix: invoicePrefix.trim() || 'INV',
        planId: selectedPlanId,
        subscriptionExpiresAt: expiryIso,
        subscriptionStatus: isPastExpiry ? 'EXPIRED' : 'ACTIVE',
        status: isPastExpiry ? 'INACTIVE' : existing.status,
        sundryKhatabookEnabled: sundryKhatabook === 'ENABLED',
        enabledFeatureIds,
        updatedAt: new Date().toISOString(),
      };

      localStore.saveCompany(updatedCompany);

      // Update merchant user if password or name provided
      const merchantUser = users.find((u) => u.companyId === targetCompanyId && u.role === 'MERCHANT');
      if (merchantUser) {
        const updatedMerchant: User = {
          ...merchantUser,
          name: ownerName.trim() || merchantUser.name,
          mobile: registeredPhone.trim() || merchantUser.mobile,
          email: email.trim() || merchantUser.email,
          updatedAt: new Date().toISOString(),
        };
        localStore.saveUser(updatedMerchant, password.trim() ? password.trim() : undefined);
      }

      showToast(`Merchant account '${updatedCompany.name}' updated successfully.`);
    } else {
      // Create New
      const existingUser = localStore.getAllUsers().find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (existingUser) {
        alert(`Username '${username}' is already taken. Please choose another username.`);
        return;
      }

      const companyId = `comp_${Date.now()}`;
      const newCompany: Company = {
        id: companyId,
        name: businessName.trim(),
        businessTypeId: isCustomType ? `custom_${customTypeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}` : businessTypeId,
        customBusinessTypeName: isCustomType ? customTypeName.trim() : undefined,
        ownerName: ownerName.trim(),
        mobile: registeredPhone.trim(),
        email: email.trim(),
        address: shopAddress.trim(),
        city: city.trim() || 'Patna',
        state: stateName.trim() || 'Bihar',
        pincode: pinCode.trim() || '800001',
        gstin: gstin.trim(),
        invoicePrefix: invoicePrefix.trim() || 'INV',
        currency: 'INR',
        taxMode: 'EXCLUSIVE',
        planId: selectedPlanId,
        subscriptionStatus: isPastExpiry ? 'EXPIRED' : 'ACTIVE',
        subscriptionExpiresAt: expiryIso,
        enabledModules: ['billing', 'inventory', 'customers', 'suppliers', 'expenses', 'reports', 'gst'],
        enabledFeatureIds,
        sundryKhatabookEnabled: sundryKhatabook === 'ENABLED',
        branchesCount: 1,
        status: isPastExpiry ? 'INACTIVE' : 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const merchantId = `usr_mer_${Date.now()}`;
      const newMerchant: User = {
        id: merchantId,
        username: username.trim(),
        email: email.trim() || `${username.trim()}@vypaarmitra.com`,
        mobile: registeredPhone.trim() || '9876543210',
        name: ownerName.trim() || businessName.trim(),
        role: 'MERCHANT',
        companyId: companyId,
        status: 'ACTIVE',
        permissions: ['*'],
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStore.saveCompany(newCompany);
      localStore.saveUser(newMerchant, password.trim());

      // Seed starter stock items tailored to the business type!
      localStore.seedCompanyInitialStock(companyId, newCompany.businessTypeId);

      showToast(`Merchant account '${newCompany.name}' created with starter inventory.`);
    }

    setIsModalOpen(false);
    loadData();
  };

  // Toggle Account Active / Block
  const handleToggleBlock = (comp: Company) => {
    const newStatus: AccountStatus = comp.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const updated: Company = {
      ...comp,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    localStore.saveCompany(updated);
    showToast(`Account '${comp.name}' set to ${newStatus}.`);
    loadData();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    localStore.deleteCompany(deleteTarget.id);
    showToast(`Permanently deleted '${deleteTarget.name}' and all associated cloud data.`);
    setDeleteTarget(null);
    loadData();
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = ['Shop Name', 'Owner', 'Username', 'Phone', 'Shop Type', 'Plan', 'Validity Date', 'Khatabook', 'Status'];
    const rows = filteredCompanies.map((c) => {
      const merchant = users.find((u) => u.companyId === c.id && u.role === 'MERCHANT');
      const bTypeName = c.customBusinessTypeName || allBusinessTypes.find((t) => t.id === c.businessTypeId)?.name || c.businessTypeId;
      return [
        `"${c.name}"`,
        `"${c.ownerName || merchant?.name || ''}"`,
        `"${merchant?.username || ''}"`,
        `"${c.mobile || ''}"`,
        `"${bTypeName}"`,
        `"${c.planId}"`,
        `"${c.subscriptionExpiresAt ? c.subscriptionExpiresAt.split('T')[0] : ''}"`,
        `"${c.sundryKhatabookEnabled !== false ? 'On' : 'Off'}"`,
        `"${c.status}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `merchant_accounts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF / Print
  const handleExportPdf = () => {
    window.print();
  };

  // Filtered List Computation
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const merchant = users.find((u) => u.companyId === c.id && u.role === 'MERCHANT');
      const bTypeName = c.customBusinessTypeName || allBusinessTypes.find((t) => t.id === c.businessTypeId)?.name || c.businessTypeId;

      // Search
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchOwner = (c.ownerName || '').toLowerCase().includes(q) || (merchant?.name || '').toLowerCase().includes(q);
        const matchUser = (merchant?.username || '').toLowerCase().includes(q);
        const matchPhone = (c.mobile || '').includes(q) || (merchant?.mobile || '').includes(q);
        if (!matchName && !matchOwner && !matchUser && !matchPhone) return false;
      }

      // Status
      const isExpired = c.subscriptionExpiresAt && new Date(c.subscriptionExpiresAt).getTime() < Date.now();
      if (statusFilter === 'ACTIVE') {
        if (c.status !== 'ACTIVE' || isExpired) return false;
      } else if (statusFilter === 'EXPIRED') {
        if (!isExpired && c.subscriptionStatus !== 'EXPIRED') return false;
      } else if (statusFilter === 'BLOCKED') {
        if (c.status !== 'BLOCKED' && c.status !== 'SUSPENDED') return false;
      }

      // Plan
      if (planFilter !== 'ALL') {
        if (c.planId.toUpperCase() !== planFilter.toUpperCase()) return false;
      }

      // Shop Type
      if (shopTypeFilter !== 'ALL') {
        if (c.businessTypeId !== shopTypeFilter && c.customBusinessTypeName !== shopTypeFilter) return false;
      }

      return true;
    });
  }, [companies, users, allBusinessTypes, searchInput, statusFilter, planFilter, shopTypeFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / rowsPerPage));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCompanies.slice(start, start + rowsPerPage);
  }, [filteredCompanies, currentPage]);

  // Helper for Selected Plan Description
  const activePlanDetails = useMemo(() => {
    return availablePlans.find((p) => p.id === selectedPlanId);
  }, [availablePlans, selectedPlanId]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Merchant accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a shop login, assign a subscription plan, switch individual features on or off, control validity and delete accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 hidden md:flex">
            <span>Last updated {lastUpdated || 'just now'}</span>
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New merchant account</span>
          </button>
        </div>
      </div>

      {/* Square Filter Section Container (Image 1) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 text-xs">
          {/* Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search shop, owner, username or phone..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PLAN */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PLAN</span>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All</option>
                <option value="BASIC">Basic</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            {/* STATUS */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="BLOCKED">Suspended</option>
              </select>
            </div>

            {/* SHOP TYPE */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SHOP TYPE</span>
              <select
                value={shopTypeFilter}
                onChange={(e) => {
                  setShopTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 max-w-[170px] truncate"
              >
                <option value="ALL">All</option>
                {allBusinessTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter */}
            <div className="text-slate-400 text-xs font-medium px-2">
              {currentPage} of {totalPages}
            </div>

            {/* Action: Export Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Excel</span>
            </button>

            {/* Action: Export PDF */}
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Merchant Accounts Table (Image 1) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">SHOP & LOGIN</th>
                <th className="px-4 py-3">OWNER</th>
                <th className="px-4 py-3">PLAN</th>
                <th className="px-4 py-3">VALID UPTO</th>
                <th className="px-4 py-3">KHATABOOK</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Store className="w-9 h-9 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-700 text-sm">No merchant accounts found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try resetting filters or click '+ New merchant account' to create a shop.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((comp) => {
                  const merchant = users.find((u) => u.companyId === comp.id && u.role === 'MERCHANT');
                  const bTypeName =
                    comp.customBusinessTypeName ||
                    allBusinessTypes.find((t) => t.id === comp.businessTypeId)?.name ||
                    comp.businessTypeId;

                  const expiryDate = comp.subscriptionExpiresAt ? new Date(comp.subscriptionExpiresAt) : null;
                  const now = new Date();
                  const isExpired = expiryDate ? expiryDate.getTime() < now.getTime() : false;
                  const daysDiff = expiryDate
                    ? Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                  const featureCount = comp.enabledFeatureIds?.length || 16;
                  const isKhatabookOn = comp.sundryKhatabookEnabled !== false;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* SHOP & LOGIN */}
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900 text-sm tracking-tight">{comp.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-indigo-700">@{merchant?.username || 'user'}</span>
                          <span>·</span>
                          <span className="text-slate-600">{bTypeName}</span>
                        </div>
                      </td>

                      {/* OWNER */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{comp.ownerName || merchant?.name || '—'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {comp.mobile || merchant?.mobile || '—'}
                        </div>
                      </td>

                      {/* PLAN */}
                      <td className="px-4 py-3.5">
                        <div className="inline-block px-3 py-0.5 rounded-full border border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold text-[11px]">
                          {comp.planId.charAt(0).toUpperCase() + comp.planId.slice(1).toLowerCase()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {featureCount} features
                        </div>
                      </td>

                      {/* VALID UPTO */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {expiryDate
                            ? `${String(expiryDate.getDate()).padStart(2, '0')}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${expiryDate.getFullYear()}`
                            : '—'}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {isExpired ? (
                            <span className="text-rose-600 font-bold">Expired {Math.abs(daysDiff)} days ago</span>
                          ) : (
                            <span className="text-slate-400">{daysDiff} days left</span>
                          )}
                        </div>
                      </td>

                      {/* KHATABOOK */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isKhatabookOn
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {isKhatabookOn ? 'On' : 'Off'}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border ${
                            isExpired
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : comp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isExpired ? 'expired' : comp.status.toLowerCase()}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenManage(comp)}
                          title="Manage Account"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Manage</span>
                        </button>

                        <button
                          onClick={() => handleToggleBlock(comp)}
                          title={comp.status === 'ACTIVE' ? 'Suspend / Block' : 'Activate'}
                          className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(comp)}
                          title="Delete Account Permanently"
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Manage Account Modal (Images 2 & 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Manage merchant shop account' : 'Create merchant shop account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only the company admin panel can create merchant and support logins.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAccount} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* SECTION: SHOP DETAILS */}
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  SHOP DETAILS
                </div>

                {/* Row 1: Business Name & Business Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      BUSINESS / SHOP NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. NPB Mart / Sharma Medical"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        BUSINESS / SHOP TYPE
                      </label>
                      <span className="text-[10px] text-slate-400">use Custom for any other trade</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isCustomType ? (
                        <select
                          value={businessTypeId}
                          onChange={(e) => setBusinessTypeId(e.target.value)}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 truncate"
                        >
                          {allBusinessTypes.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={customTypeName}
                          onChange={(e) => setCustomTypeName(e.target.value)}
                          placeholder="Enter Custom Business / Shop Type Name"
                          className="flex-1 p-2 bg-white border border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-indigo-900"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => setIsCustomType(!isCustomType)}
                        className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                          isCustomType
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Custom</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Owner Name & Registered Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      OWNER NAME
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        REGISTERED PHONE NO.
                      </label>
                      <span className="text-[10px] text-slate-400">used by support to find complaints</span>
                    </div>
                    <input
                      type="text"
                      value={registeredPhone}
                      onChange={(e) => setRegisteredPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Row 3: Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. owner@example.com"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Row 4: Shop Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                    SHOP ADDRESS
                  </label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="e.g. Shop No. 12, Main Market Road"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Row 5: City / Town & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      CITY / TOWN
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Patna / Muzaffarpur"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      STATE
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Bihar"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Row 6: Pin Code & GSTIN (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      PIN CODE
                    </label>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 800001"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      GSTIN (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 10ABCDE1234F1Z5"
                      className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>

                {/* Row 7: Invoice Prefix */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      INVOICE PREFIX
                    </label>
                    <span className="text-[10px] text-slate-400">e.g. INV, BILL</span>
                  </div>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    placeholder="INV"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase font-mono"
                  />
                </div>
              </div>

              {/* SECTION: MERCHANT PANEL LOGIN */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  MERCHANT PANEL LOGIN
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      required={!isEditing}
                      disabled={isEditing}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                      placeholder="e.g. npbmart / sharmamedical"
                      className="w-full p-2 bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      PASSWORD {isEditing && <span className="text-[10px] text-slate-400 font-normal">(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="text"
                      required={!isEditing}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEditing ? 'Enter new password if changing' : 'Enter login password'}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: PLAN & VALIDITY */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  PLAN & VALIDITY
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      SUBSCRIPTION PLAN
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => handlePlanChange(e.target.value as PlanId)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold"
                    >
                      {availablePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{p.priceMonthly || p.price || 0} / {p.validityDays || 365}d
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {activePlanDetails?.description || 'Standard business tier'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        ACCOUNT VALID UPTO
                      </label>
                      <span className="text-[10px] text-slate-400">shown in merchant panel</span>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={accountValidUpto}
                        onChange={(e) => setAccountValidUpto(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                      SUNDRY KHATABOOK
                    </label>
                    <select
                      value={sundryKhatabook}
                      onChange={(e) => setSundryKhatabook(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="ENABLED">Activated for this shop</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: FEATURE BUNDLE (Image 2) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    FEATURE BUNDLE - {enabledFeatureIds.length}/16 ENABLED
                  </span>
                  <div className="space-x-3 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllFeatures}
                      className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearAllFeatures}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {SAAS_FEATURES.map((feature) => {
                    const isChecked = enabledFeatureIds.includes(feature.id);
                    return (
                      <label
                        key={feature.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/40 border-indigo-300 text-slate-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(feature.id)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs">{feature.name}</span>
                      </label>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  Ticking an extra feature here gives this shop module free of cost without changing the plan for any other merchant.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isEditing ? 'Save changes' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Permanently Delete Merchant Shop?</h3>
                <p className="text-xs text-slate-500">Zero-data-loss Firebase cloud deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">'{deleteTarget.name}'</strong>?
              This will immediately purge the business record, merchant login, and all associated products from this device and Firebase Realtime Database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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

      {/* Database Connection Required Modal */}
      {showDbRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-amber-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-amber-600" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Database Connection Required</h3>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                Please connect database setup after setup can create merchant shop account.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dual-Engine Cloud Storage</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Connecting Firebase Realtime Database and Cloud Firestore ensures all merchant accounts, invoices, and stock inventory are safely preserved without data loss.
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
    </div>
  );
}
