'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localStore } from '@/lib/store/localStore';
import { User, SupportLevel } from '@/types';
import {
  Users2,
  Headphones,
  Code2,
  CheckCircle2,
  Ban,
  Pencil,
  KeyRound,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Sliders,
  X,
  AlertCircle,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Shield,
  Filter,
  Check,
} from 'lucide-react';

type StaffTab = 'SUPPORT' | 'DEVELOPER';

export default function SuperAdminStaffManagementPage() {
  const [activeTab, setActiveTab] = useState<StaffTab>('SUPPORT');
  const [users, setUsers] = useState<User[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'SUSPENDED' | 'ALL'>('ACTIVE');
  const [supportLevelFilter, setSupportLevelFilter] = useState<string>('ALL');
  const [developerPermFilter, setDeveloperPermFilter] = useState<string>('ALL');
  const [rowsPerPageOption, setRowsPerPageOption] = useState<string>('10');
  const [customRowsInput, setCustomRowsInput] = useState<string>('15');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // New Account Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSupportLevel, setNewSupportLevel] = useState<SupportLevel>('L1');
  const [newDevPermissions, setNewDevPermissions] = useState<string[]>([
    'infra.manage',
    'db.access',
    'logs.view',
  ]);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Account Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSupportLevel, setEditSupportLevel] = useState<SupportLevel>('L1');
  const [editDevPermissions, setEditDevPermissions] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  // Password Reset Modal State
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // Multi-Selection State
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const loadData = () => {
    const all = localStore.getAllUsers();
    setUsers(all.filter((u) => u.role === 'SUPPORT' || u.role === 'DEVELOPER'));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchTab = new URLSearchParams(window.location.search).get('tab')?.toUpperCase();
      if (searchTab === 'DEVELOPER' || searchTab === 'SUPPORT') {
        setActiveTab(searchTab as StaffTab);
      }
    }
    loadData();
    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch between Support and Developer tabs (with URL ?tab=support|developer sync)
  const handleSwitchTab = (tab: StaffTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab.toLowerCase());
      window.history.replaceState(null, '', url.toString());
    }
    setCurrentPage(1);
    setSearchInput('');
    setActiveSearch('');
    setStatusFilter('ACTIVE');
    setSupportLevelFilter('ALL');
    setDeveloperPermFilter('ALL');
    setSelectedStaffIds(new Set());
  };

  // Search trigger
  const handleTriggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchInput.trim());
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setStatusFilter('ACTIVE');
    setSupportLevelFilter('ALL');
    setDeveloperPermFilter('ALL');
    setRowsPerPageOption('10');
    setCurrentPage(1);
  };

  // Rows per page calculation
  const rowsPerPage = useMemo(() => {
    if (rowsPerPageOption === 'custom') {
      const parsed = parseInt(customRowsInput, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : parsed;
    }
    return parseInt(rowsPerPageOption, 10) || 10;
  }, [rowsPerPageOption, customRowsInput]);

  // Filtered staff based on activeTab and filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== activeTab) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && u.status !== 'ACTIVE') return false;
        if (statusFilter === 'SUSPENDED' && u.status !== 'SUSPENDED' && u.status !== 'INACTIVE') return false;
      }

      // Role specific filter
      if (activeTab === 'SUPPORT' && supportLevelFilter !== 'ALL') {
        if (u.supportLevel !== supportLevelFilter) return false;
      }
      if (activeTab === 'DEVELOPER' && developerPermFilter !== 'ALL') {
        if (!(u.permissions || []).includes(developerPermFilter)) return false;
      }

      // Search Query
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesUser = u.username.toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesMobile = (u.mobile || '').includes(q);
        return matchesName || matchesUser || matchesEmail || matchesMobile;
      }

      return true;
    });
  }, [users, activeTab, statusFilter, supportLevelFilter, developerPermFilter, activeSearch]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedStaffIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStaffIds(next);
  };

  const isAllFilteredSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedStaffIds.has(u.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const next = new Set(selectedStaffIds);
      paginatedUsers.forEach((u) => next.delete(u.id));
      setSelectedStaffIds(next);
    } else {
      const next = new Set(selectedStaffIds);
      paginatedUsers.forEach((u) => next.add(u.id));
      setSelectedStaffIds(next);
    }
  };

  const handleDeselectAll = () => {
    setSelectedStaffIds(new Set());
  };

  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedStaffIds);
    if (ids.length === 0) return;
    const count = localStore.deleteUsers(ids);
    loadData();
    setSelectedStaffIds(new Set());
    setBulkDeleteModalOpen(false);
    showToast(`Permanently deleted ${count} ${activeTab.toLowerCase()} accounts from database.`);
  };

  // Reset to page 1 if current page exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Open Create Modal
  const handleOpenAddModal = () => {
    setNewName('');
    setNewUsername('');
    setNewPassword('Secure@123');
    setNewMobile('');
    setNewEmail('');
    setNewSupportLevel('L1');
    setNewDevPermissions(['infra.manage', 'db.access', 'logs.view']);
    setAddError(null);
    setShowAddModal(true);
  };

  // Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddError('Please fill in Name, Username, and Password.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();
    const existing = localStore
      .getAllUsers()
      .find((u) => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      setAddError(`Username '@${cleanUsername}' is already taken. Please choose another.`);
      return;
    }

    const newUser: User = {
      id: `usr_${activeTab.toLowerCase()}_${Date.now()}`,
      username: cleanUsername,
      name: newName.trim(),
      mobile: newMobile.trim() || '9876543210',
      email: newEmail.trim() || `${cleanUsername}@npbmedia.com`,
      role: activeTab,
      supportLevel: activeTab === 'SUPPORT' ? newSupportLevel : undefined,
      permissions:
        activeTab === 'DEVELOPER'
          ? newDevPermissions
          : newSupportLevel === 'L4'
          ? ['tickets.manage', 'merchants.manage', 'password.reset', 'sla.override']
          : newSupportLevel === 'L3'
          ? ['tickets.manage', 'merchants.view', 'password.reset']
          : newSupportLevel === 'L2'
          ? ['tickets.manage', 'merchants.view']
          : ['tickets.view', 'merchants.view'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveUser(newUser, newPassword.trim());
    localStore.addAuditLog({
      userId: 'usr_superadmin_bootstrap',
      userName: 'NPB Master Administrator',
      userRole: 'SUPER_ADMIN',
      action: `${activeTab}_ACCOUNT_CREATED`,
      module: 'admin',
      entityType: 'user',
      entityId: newUser.id,
      details: `Created ${activeTab} account @${newUser.username} (${newUser.name})`,
    });

    loadData();
    setShowAddModal(false);
    showToast(`${activeTab === 'SUPPORT' ? 'Support' : 'Developer'} account @${newUser.username} created successfully`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditMobile(user.mobile || '');
    setEditEmail(user.email || '');
    setEditSupportLevel(user.supportLevel || 'L1');
    setEditDevPermissions(user.permissions || ['infra.view']);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim()) {
      setEditError('Name is required');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editName.trim(),
      mobile: editMobile.trim(),
      email: editEmail.trim(),
      supportLevel: editingUser.role === 'SUPPORT' ? editSupportLevel : undefined,
      permissions:
        editingUser.role === 'DEVELOPER'
          ? editDevPermissions
          : editSupportLevel === 'L4'
          ? ['tickets.manage', 'merchants.manage', 'password.reset', 'sla.override']
          : editSupportLevel === 'L3'
          ? ['tickets.manage', 'merchants.view', 'password.reset']
          : editSupportLevel === 'L2'
          ? ['tickets.manage', 'merchants.view']
          : ['tickets.view', 'merchants.view'],
      updatedAt: new Date().toISOString(),
    };

    localStore.saveUser(updatedUser);
    localStore.addAuditLog({
      userId: 'usr_superadmin_bootstrap',
      userName: 'NPB Master Administrator',
      userRole: 'SUPER_ADMIN',
      action: `${editingUser.role}_ACCOUNT_UPDATED`,
      module: 'admin',
      entityType: 'user',
      entityId: updatedUser.id,
      details: `Updated details for @${updatedUser.username} (${updatedUser.name})`,
    });

    loadData();
    setEditingUser(null);
    showToast(`Account @${updatedUser.username} updated successfully`);
  };

  // Toggle Active / Suspend
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    localStore.updateUserStatus(user.id, newStatus);
    localStore.addAuditLog({
      userId: 'usr_superadmin_bootstrap',
      userName: 'NPB Master Administrator',
      userRole: 'SUPER_ADMIN',
      action: `${user.role}_STATUS_CHANGED`,
      module: 'admin',
      entityType: 'user',
      entityId: user.id,
      details: `Changed status for @${user.username} to ${newStatus}`,
    });

    loadData();
    showToast(
      newStatus === 'ACTIVE'
        ? `Account @${user.username} activated`
        : `Account @${user.username} suspended`
    );
  };

  // Change Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (!newPasswordInput.trim()) {
      setPasswordError('Please enter a new password');
      return;
    }

    localStore.changeUserPassword(passwordTargetUser.id, newPasswordInput.trim());
    showToast(`Password updated for @${passwordTargetUser.username}`);
    setPasswordTargetUser(null);
    setNewPasswordInput('');
    setPasswordError(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    localStore.deleteUser(deleteTargetUser.id);
    localStore.addAuditLog({
      userId: 'usr_superadmin_bootstrap',
      userName: 'NPB Master Administrator',
      userRole: 'SUPER_ADMIN',
      action: `${deleteTargetUser.role}_ACCOUNT_DELETED`,
      module: 'admin',
      entityType: 'user',
      entityId: deleteTargetUser.id,
      details: `Permanently deleted @${deleteTargetUser.username} (${deleteTargetUser.name})`,
    });

    loadData();
    showToast(`Account @${deleteTargetUser.username} deleted`);
    setDeleteTargetUser(null);
  };

  // Toggle Developer Permission Chip in Modals
  const toggleDevPerm = (perm: string, isEdit = false) => {
    if (isEdit) {
      setEditDevPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    } else {
      setNewDevPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    }
  };

  // Developer permissions catalog
  const DEV_PERMISSIONS = [
    { key: 'infra.manage', label: 'Infra Management' },
    { key: 'infra.view', label: 'Infra View Only' },
    { key: 'db.access', label: 'Database Access' },
    { key: 'logs.view', label: 'System Logs' },
    { key: 'api.config', label: 'API & Webhooks' },
    { key: 'security.audit', label: 'Security Audits' },
  ];

  const supportCount = users.filter((u) => u.role === 'SUPPORT').length;
  const developerCount = users.filter((u) => u.role === 'DEVELOPER').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-purple-500/30 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Interactive Switch Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === 'SUPPORT' ? (
                <>
                  <Headphones className="w-6 h-6 text-emerald-600" />
                  <span>Support Accounts Master</span>
                </>
              ) : (
                <>
                  <Code2 className="w-6 h-6 text-indigo-600" />
                  <span>Developer Accounts Master</span>
                </>
              )}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'SUPPORT'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {activeTab === 'SUPPORT' ? `${supportCount} Agents` : `${developerCount} Developers`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'SUPPORT'
              ? 'NPB MEDIA front-desk, technical support, and account management staff'
              : 'NPB MEDIA engineering, cloud infrastructure, and database administrators'}
          </p>
        </div>

        {/* Switch Button & Add Button Group */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Automatic Mode Switch Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchTab('SUPPORT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'SUPPORT'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Support ({supportCount})</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('DEVELOPER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'DEVELOPER'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer ({developerCount})</span>
            </button>
          </div>

          {/* New Account Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm ${
              activeTab === 'SUPPORT'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'SUPPORT' ? 'New Support Account' : 'New Developer Account'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Square Accounts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header & Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleTriggerSearch} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab.toLowerCase()} accounts by name, username, mobile...`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Search
              </button>
            </form>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="ACTIVE">Active (Default)</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ALL">All Status</option>
                </select>
              </div>

              {/* Role-Specific Filter */}
              {activeTab === 'SUPPORT' ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-bold text-[11px]">Level:</span>
                  <select
                    value={supportLevelFilter}
                    onChange={(e) => {
                      setSupportLevelFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">All Levels</option>
                    <option value="L1">L1 - Front Desk</option>
                    <option value="L2">L2 - Resolution</option>
                    <option value="L3">L3 - Billing &amp; Data</option>
                    <option value="L4">L4 - Support Admin</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-bold text-[11px]">Scope:</span>
                  <select
                    value={developerPermFilter}
                    onChange={(e) => {
                      setDeveloperPermFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">All Scopes</option>
                    <option value="infra.manage">Infra Manage</option>
                    <option value="db.access">Database Access</option>
                    <option value="logs.view">Logs View</option>
                    <option value="api.config">API Config</option>
                  </select>
                </div>
              )}

              {/* Rows Per Page Dropdown (Default 10) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold text-[11px]">Rows:</span>
                <select
                  value={rowsPerPageOption}
                  onChange={(e) => {
                    setRowsPerPageOption(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="10">10 (Default)</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="custom">Custom</option>
                </select>

                {rowsPerPageOption === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={customRowsInput}
                    onChange={(e) => setCustomRowsInput(e.target.value)}
                    className="w-14 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold"
                    placeholder="Rows"
                  />
                )}
              </div>

              {/* Reset Filters */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedStaffIds.size > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black">
                {selectedStaffIds.size}
              </span>
              <span className="text-xs font-bold">
                {selectedStaffIds.size} {selectedStaffIds.size === 1 ? 'account' : 'accounts'} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedStaffIds.size})</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <div className="overflow-x-auto">
          {paginatedUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Users2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-sm">No Accounts Found</div>
              <p className="text-slate-400 mt-1">
                No {activeTab.toLowerCase()} accounts match the current filter criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      title={isAllFilteredSelected ? 'Deselect All' : 'Select All'}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 min-w-[180px]">Staff Name &amp; Email</th>
                  <th className="py-3 px-3 min-w-[130px]">Username</th>
                  <th className="py-3 px-3 min-w-[110px]">Mobile</th>
                  <th className="py-3 px-3 min-w-[140px]">
                    {activeTab === 'SUPPORT' ? 'Support Tier' : 'Scope / Permissions'}
                  </th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Status</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Registered</th>
                  <th className="py-3 px-4 text-right min-w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => {
                  const isActive = u.status === 'ACTIVE';
                  const isSelected = selectedStaffIds.has(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-purple-50/20 transition-colors ${
                        isSelected ? 'bg-purple-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(u.id)}
                          className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-purple-700 text-[11px] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                          @{u.username}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {u.mobile || '—'}
                      </td>

                      {/* Tier / Permissions */}
                      <td className="py-3 px-3">
                        {u.role === 'SUPPORT' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              u.supportLevel === 'L4'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : u.supportLevel === 'L3'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : u.supportLevel === 'L2'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Headphones className="w-3 h-3" />
                            <span>Tier {u.supportLevel || 'L1'}</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.permissions || []).slice(0, 2).map((p) => (
                              <span
                                key={p}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"
                              >
                                {p.split('.')[0]}
                              </span>
                            ))}
                            {(u.permissions || []).length > 2 && (
                              <span className="text-[9px] font-bold text-slate-400">
                                +{(u.permissions || []).length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-3 text-center text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-purple-700 transition-colors"
                            title="Edit Account Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Change Password Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordTargetUser(u);
                              setNewPasswordInput('');
                              setPasswordError(null);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
                            title="Change Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Active / Suspend Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isActive
                                ? 'border-amber-200 hover:bg-amber-50 text-amber-600 hover:text-amber-800'
                                : 'border-emerald-200 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800'
                            }`}
                            title={isActive ? 'Suspend Account' : 'Activate Account'}
                          >
                            {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetUser(u)}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section Footer / Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing{' '}
            <span className="font-bold text-slate-800">
              {filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredUsers.length}</span> {activeTab.toLowerCase()} accounts
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ADD NEW ACCOUNT MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  {activeTab === 'SUPPORT' ? (
                    <>
                      <Headphones className="w-5 h-5 text-emerald-600" />
                      <span>Provision Support Specialist</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-5 h-5 text-indigo-600" />
                      <span>Provision Developer Account</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign credentials and operational privileges for NPB Media team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FULL NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newUsername) {
                        setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">USERNAME *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ramesh_help"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MOBILE NUMBER</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9812345678"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@npbmedia.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">INITIAL PASSWORD *</label>
                <input
                  type="text"
                  required
                  placeholder="Set initial password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-slate-900"
                />
              </div>

              {/* Role Specific Configuration */}
              {activeTab === 'SUPPORT' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SUPPORT TIER LEVEL *</label>
                  <select
                    value={newSupportLevel}
                    onChange={(e) => setNewSupportLevel(e.target.value as SupportLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="L1">L1 - Front Desk (View Only, Tickets Response)</option>
                    <option value="L2">L2 - Resolution Agent (Edit Store Basic Info)</option>
                    <option value="L3">L3 - Senior Technical (Password Reset &amp; Ledger Assist)</option>
                    <option value="L4">L4 - Team Lead (Full Support Admin &amp; SLA Override)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    DEVELOPER SCOPE PERMISSIONS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEV_PERMISSIONS.map((perm) => {
                      const isChecked = newDevPermissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => toggleDevPerm(perm.key)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-bold text-[11px]">{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-sm ${
                    activeTab === 'SUPPORT'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  Create {activeTab === 'SUPPORT' ? 'Support' : 'Developer'} Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EDIT ACCOUNT MODAL */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Edit Account: @{editingUser.username}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update staff profile and assigned security privileges.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MOBILE NUMBER</label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Role Specific Configuration */}
              {editingUser.role === 'SUPPORT' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SUPPORT TIER LEVEL *</label>
                  <select
                    value={editSupportLevel}
                    onChange={(e) => setEditSupportLevel(e.target.value as SupportLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="L1">L1 - Front Desk (View Only, Tickets Response)</option>
                    <option value="L2">L2 - Resolution Agent (Edit Store Basic Info)</option>
                    <option value="L3">L3 - Senior Technical (Password Reset &amp; Ledger Assist)</option>
                    <option value="L4">L4 - Team Lead (Full Support Admin &amp; SLA Override)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    DEVELOPER SCOPE PERMISSIONS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEV_PERMISSIONS.map((perm) => {
                      const isChecked = editDevPermissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => toggleDevPerm(perm.key, true)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-bold text-[11px]">{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm shadow-purple-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CHANGE PASSWORD MODAL */}
      {/* ========================================================= */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Change Password</h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    @{passwordTargetUser.username} ({passwordTargetUser.name})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">NEW PASSWORD *</label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Password will be updated immediately in the local credential vault.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              Delete Account &ldquo;{deleteTargetUser.name}&rdquo;?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to permanently delete the {deleteTargetUser.role.toLowerCase()} account{' '}
              <span className="font-mono font-bold text-slate-800">@{deleteTargetUser.username}</span>?
              This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MULTIPLE BULK DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Delete Selected Accounts?
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Bulk permanent account deletion ({activeTab.toLowerCase()})
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-3">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-bold">{selectedStaffIds.size}</strong> selected {activeTab.toLowerCase()} accounts from the database?
            </p>

            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl mb-4 font-semibold text-[11px] leading-relaxed">
              ⚠️ Permanent Database Deletion: User credentials and role access will be permanently removed from the system. This action cannot be reversed.
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Permanently Delete ({selectedStaffIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
