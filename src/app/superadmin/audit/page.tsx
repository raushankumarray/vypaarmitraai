'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { localStore } from '@/lib/store/localStore';
import { AuditLog } from '@/types';
import {
  ScrollText,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  UserCheck,
  Trash2,
  Calendar,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';

// Date utility functions for accurate local time matching
const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

const getLocalMonthString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getLogLocalDate = (isoTimestamp: string): string => {
  try {
    const d = new Date(isoTimestamp);
    return getLocalDateString(d);
  } catch {
    return isoTimestamp.split('T')[0] || '';
  }
};

const getLogLocalMonth = (isoTimestamp: string): string => {
  try {
    const d = new Date(isoTimestamp);
    return getLocalMonthString(d);
  } catch {
    return (isoTimestamp.split('T')[0] || '').substring(0, 7);
  }
};

const formatReadableDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatReadableMonth = (monthStr: string): string => {
  try {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
};

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Date Filter State: Default is TODAY
  const [dateFilterMode, setDateFilterMode] = useState<'TODAY' | 'YESTERDAY' | 'CUSTOM_DAY' | 'MONTH' | 'ALL'>('TODAY');
  const [customDate, setCustomDate] = useState<string>(getLocalDateString());
  const [customMonth, setCustomMonth] = useState<string>(getLocalMonthString());

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Action Menus
  const [deleteTargetLog, setDeleteTargetLog] = useState<AuditLog | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [masterPurgeModal, setMasterPurgeModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadLogs = () => {
    setLogs(localStore.getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
    const unsub = localStore.subscribe(() => loadLogs());
    return () => unsub();
  }, []);

  // Filter logs based on date, search, module, and role
  const filteredLogs = useMemo(() => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();

    return logs.filter((log) => {
      // 1. Date Filter
      if (dateFilterMode === 'TODAY') {
        if (getLogLocalDate(log.timestamp) !== todayStr) return false;
      } else if (dateFilterMode === 'YESTERDAY') {
        if (getLogLocalDate(log.timestamp) !== yesterdayStr) return false;
      } else if (dateFilterMode === 'CUSTOM_DAY') {
        if (getLogLocalDate(log.timestamp) !== customDate) return false;
      } else if (dateFilterMode === 'MONTH') {
        if (getLogLocalMonth(log.timestamp) !== customMonth) return false;
      }
      // 'ALL' passes all dates

      // 2. Module Filter
      if (selectedModule !== 'ALL' && log.module.toLowerCase() !== selectedModule.toLowerCase()) {
        return false;
      }

      // 3. Role Filter
      if (selectedRole !== 'ALL' && log.userRole !== selectedRole) {
        return false;
      }

      // 4. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          log.action.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q) ||
          (log.companyId && log.companyId.toLowerCase().includes(q)) ||
          (log.entityId && log.entityId.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, dateFilterMode, customDate, customMonth, selectedModule, selectedRole, search]);

  // Clean selected IDs if filtered logs change
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllFilteredSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedIds.has(l.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered
      const next = new Set(selectedIds);
      filteredLogs.forEach((l) => next.delete(l.id));
      setSelectedIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedIds);
      filteredLogs.forEach((l) => next.add(l.id));
      setSelectedIds(next);
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Manual Single Row Delete
  const handleConfirmSingleDelete = () => {
    if (!deleteTargetLog) return;
    localStore.deleteAuditLog(deleteTargetLog.id);
    const next = new Set(selectedIds);
    next.delete(deleteTargetLog.id);
    setSelectedIds(next);
    setDeleteTargetLog(null);
    showToast('Audit log record permanently deleted.');
  };

  // Multiple Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const deletedCount = localStore.deleteAuditLogs(ids);
    setSelectedIds(new Set());
    setBulkDeleteModalOpen(false);
    showToast(`Successfully deleted ${deletedCount} selected audit log records.`);
  };

  // Master Purge Actions
  const handlePurgeFilteredLogs = () => {
    setMasterMenuOpen(false);
    if (filteredLogs.length === 0) {
      showToast('No logs match the current filter to delete.');
      return;
    }
    setMasterPurgeModal({
      open: true,
      title: `Delete All Filtered Logs (${filteredLogs.length} Records)`,
      description: `This will permanently delete all ${filteredLogs.length} audit logs currently visible under the active filter (${dateFilterMode.toLowerCase()}). This action cannot be undone.`,
      action: () => {
        const ids = filteredLogs.map((l) => l.id);
        const count = localStore.deleteAuditLogs(ids);
        setSelectedIds(new Set());
        setMasterPurgeModal(null);
        showToast(`Permanently deleted ${count} audit log entries.`);
      },
    });
  };

  const handlePurgeTodayLogs = () => {
    setMasterMenuOpen(false);
    const todayStr = getLocalDateString();
    setMasterPurgeModal({
      open: true,
      title: "Purge All Today's Audit Logs",
      description: `This will permanently delete all audit logs recorded today (${formatReadableDate(todayStr)}).`,
      action: () => {
        const count = localStore.clearAuditLogs({ date: todayStr });
        setSelectedIds(new Set());
        setMasterPurgeModal(null);
        showToast(`Cleared ${count} audit logs for today.`);
      },
    });
  };

  const handlePurgeMonthLogs = () => {
    setMasterMenuOpen(false);
    const monthStr = customMonth;
    setMasterPurgeModal({
      open: true,
      title: `Purge All Logs for Month (${formatReadableMonth(monthStr)})`,
      description: `This will permanently delete all audit records recorded during ${formatReadableMonth(monthStr)}.`,
      action: () => {
        const count = localStore.clearAuditLogs({ month: monthStr });
        setSelectedIds(new Set());
        setMasterPurgeModal(null);
        showToast(`Cleared ${count} audit logs for ${formatReadableMonth(monthStr)}.`);
      },
    });
  };

  const handleMasterPurgeAll = () => {
    setMasterMenuOpen(false);
    setMasterPurgeModal({
      open: true,
      title: 'Master Clear Entire Audit Trail',
      description: `DANGER: This will permanently wipe ALL ${logs.length} audit log entries across the entire platform history. Are you absolutely certain?`,
      action: () => {
        const count = localStore.clearAuditLogs();
        setSelectedIds(new Set());
        setMasterPurgeModal(null);
        showToast(`Master purge complete: ${count} audit records cleared.`);
      },
    });
  };

  // Seed Demo Logs
  const handleSeedDemoLogs = () => {
    localStore.seedDemoAuditLogs();
    showToast('Sample audit events generated across Today, Yesterday, and Current Month.');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No audit logs to export.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'User Name', 'User Role', 'Module', 'Action', 'Company/Tenant ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userRole,
      l.module,
      l.action,
      l.companyId || 'SYSTEM',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vypaarmitra_audit_logs_${dateFilterMode.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredLogs.length} audit logs to CSV.`);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDateFilterMode('TODAY');
    setCustomDate(getLocalDateString());
    setCustomMonth(getLocalMonthString());
    setSelectedModule('ALL');
    setSelectedRole('ALL');
    setSearch('');
    setSelectedIds(new Set());
    showToast('Filters reset to Default (Today).');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail & Security Logs</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor system operations, filter by day or month, and manage logs with manual or master deletion.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {logs.length === 0 && (
            <button
              onClick={handleSeedDemoLogs}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Sample Logs</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            title="Download currently filtered logs as CSV"
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Master Purge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMasterMenuOpen(!masterMenuOpen)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Master Purge</span>
              <ChevronDown className="w-3 h-3 text-red-500" />
            </button>

            {masterMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMasterMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Master Deletion Tools
                  </div>
                  <button
                    onClick={handlePurgeFilteredLogs}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <div>
                      <div className="font-bold">Delete Current View Logs</div>
                      <div className="text-[10px] text-slate-400">
                        Purge all {filteredLogs.length} logs in active filter
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handlePurgeTodayLogs}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    <div>
                      <div className="font-bold">Purge All Today&apos;s Logs</div>
                      <div className="text-[10px] text-slate-400">Clear events for {formatReadableDate(getLocalDateString())}</div>
                    </div>
                  </button>
                  <button
                    onClick={handlePurgeMonthLogs}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    <div>
                      <div className="font-bold">Purge Current Month Logs</div>
                      <div className="text-[10px] text-slate-400">Clear events for {formatReadableMonth(customMonth)}</div>
                    </div>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleMasterPurgeAll}
                    className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white text-red-700 flex items-center gap-2 font-bold transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
                    <div>
                      <div>Master Wipe Entire Trail</div>
                      <div className="text-[10px] text-red-400 group-hover:text-red-100">
                        Wipe all {logs.length} system audit logs
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl">
            {logs.length} Total Platform Events
          </div>
        </div>
      </div>

      {/* Primary Timeline / Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Date & Timeline Filter</span>
            <span className="text-[11px] text-slate-400 font-normal">
              (Default shows logs for Current Date: <strong className="text-slate-700">Today</strong>)
            </span>
          </div>

          {/* Active Date Label Pill */}
          <div className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1.5 self-start md:self-auto">
            <Clock className="w-3 h-3 text-purple-600" />
            <span>
              {dateFilterMode === 'TODAY' && `Today • ${formatReadableDate(getLocalDateString())}`}
              {dateFilterMode === 'YESTERDAY' && `Yesterday • ${formatReadableDate(getYesterdayDateString())}`}
              {dateFilterMode === 'CUSTOM_DAY' && `Day • ${formatReadableDate(customDate)}`}
              {dateFilterMode === 'MONTH' && `Month • ${formatReadableMonth(customMonth)}`}
              {dateFilterMode === 'ALL' && 'All Time • Entire History'}
            </span>
            <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full ml-1">
              {filteredLogs.length}
            </span>
          </div>
        </div>

        {/* Date Filter Mode Buttons & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TODAY (Default) */}
          <button
            onClick={() => setDateFilterMode('TODAY')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 border ${
              dateFilterMode === 'TODAY'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateFilterMode === 'TODAY' && <Check className="w-3.5 h-3.5" />}
            <span>Today (Default)</span>
          </button>

          {/* YESTERDAY */}
          <button
            onClick={() => setDateFilterMode('YESTERDAY')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 border ${
              dateFilterMode === 'YESTERDAY'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateFilterMode === 'YESTERDAY' && <Check className="w-3.5 h-3.5" />}
            <span>Yesterday</span>
          </button>

          {/* DAY-WISE / SPECIFIC DAY */}
          <button
            onClick={() => setDateFilterMode('CUSTOM_DAY')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 border ${
              dateFilterMode === 'CUSTOM_DAY'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateFilterMode === 'CUSTOM_DAY' && <Check className="w-3.5 h-3.5" />}
            <span>Day-Wise Filter</span>
          </button>

          {/* MONTH-WISE */}
          <button
            onClick={() => setDateFilterMode('MONTH')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 border ${
              dateFilterMode === 'MONTH'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateFilterMode === 'MONTH' && <Check className="w-3.5 h-3.5" />}
            <span>Month-Wise Filter</span>
          </button>

          {/* ALL TIME */}
          <button
            onClick={() => setDateFilterMode('ALL')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 border ${
              dateFilterMode === 'ALL'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dateFilterMode === 'ALL' && <Check className="w-3.5 h-3.5" />}
            <span>All Time</span>
          </button>

          {/* Dynamic input when Day-Wise is active */}
          {dateFilterMode === 'CUSTOM_DAY' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 animate-in fade-in">
              <span className="text-xs font-bold text-slate-600">Select Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-purple-300 focus:border-purple-600 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus:outline-none"
              />
            </div>
          )}

          {/* Dynamic input when Month-Wise is active */}
          {dateFilterMode === 'MONTH' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 animate-in fade-in">
              <span className="text-xs font-bold text-slate-600">Select Month:</span>
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-purple-300 focus:border-purple-600 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Secondary Search & Module Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="sm:col-span-5 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action event, user, details, tenant ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Modules (Any)</option>
            <option value="auth">Authentication & Passwords</option>
            <option value="admin">Super Admin Operations</option>
            <option value="billing">POS & Billing</option>
            <option value="inventory">Inventory & Stock</option>
            <option value="customers">Customers & Khata</option>
            <option value="system">Cloud & Platform Infra</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="DEVELOPER">DEVELOPER</option>
            <option value="MERCHANT">MERCHANT</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={handleResetFilters}
            title="Reset all filters to default"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Selection Action Bar (Displays when items are checked) */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-900 text-white px-4 py-3 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-extrabold">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold">
              {selectedIds.size} {selectedIds.size === 1 ? 'audit log entry' : 'audit log entries'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-purple-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <ScrollText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-extrabold text-slate-800 text-sm">
              No Audit Events Recorded for{' '}
              {dateFilterMode === 'TODAY' && 'Today (' + formatReadableDate(getLocalDateString()) + ')'}
              {dateFilterMode === 'YESTERDAY' && 'Yesterday (' + formatReadableDate(getYesterdayDateString()) + ')'}
              {dateFilterMode === 'CUSTOM_DAY' && formatReadableDate(customDate)}
              {dateFilterMode === 'MONTH' && formatReadableMonth(customMonth)}
              {dateFilterMode === 'ALL' && 'Active Filter'}
            </div>
            <p className="text-slate-400 max-w-sm mx-auto">
              No activities match your current timeline or search criteria. You can switch filters or seed sample logs.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDateFilterMode('ALL')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                View All Time ({logs.length} Total)
              </button>
              {dateFilterMode === 'TODAY' && (
                <button
                  onClick={() => setDateFilterMode('MONTH')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold transition-colors"
                >
                  View Current Month
                </button>
              )}
              {logs.length === 0 && (
                <button
                  onClick={handleSeedDemoLogs}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Demo Events</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      title={isAllFilteredSelected ? 'Deselect all' : 'Select all filtered'}
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 whitespace-nowrap">User & Role</th>
                  <th className="px-4 py-3 whitespace-nowrap">Action Event</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Details & Tenant</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((l) => {
                  const isSelected = selectedIds.has(l.id);
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(l.id)}
                          className="text-slate-400 hover:text-purple-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {formatReadableDate(getLogLocalDate(l.timestamp))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(l.timestamp).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{l.userName}</div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${
                            l.userRole === 'SUPER_ADMIN'
                              ? 'text-purple-700 bg-purple-50 border-purple-200'
                              : l.userRole === 'DEVELOPER'
                              ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                              : l.userRole === 'SUPPORT'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-slate-700 bg-slate-50 border-slate-200'
                          }`}
                        >
                          {l.userRole}
                        </span>
                      </td>

                      {/* Action Event */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {l.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {l.module}
                        </span>
                      </td>

                      {/* Details & Tenant */}
                      <td className="px-4 py-3 text-slate-600 max-w-md">
                        <div className="text-xs text-slate-800">{l.details}</div>
                        {l.companyId && (
                          <div className="text-[10px] text-purple-600 font-mono font-bold mt-0.5">
                            tenant: {l.companyId}
                          </div>
                        )}
                      </td>

                      {/* Row Action (Manual Delete) */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTargetLog(l)}
                          title="Delete this audit record"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 px-1 gap-2">
        <div>
          Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
          <strong className="text-slate-800">{logs.length}</strong> total audit entries.
        </div>
        <div className="text-[11px] text-slate-400">
          Default timeline is pinned to current date (Today). Use Day-Wise or Month-Wise filter to inspect past trails.
        </div>
      </div>

      {/* MODAL 1: Single Log Delete Confirmation */}
      {deleteTargetLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Audit Log Entry</h3>
                <p className="text-xs text-slate-500">Manual removal of individual audit event record.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-bold text-slate-800">
                  {new Date(deleteTargetLog.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-bold text-slate-800">
                  {deleteTargetLog.userName} ({deleteTargetLog.userRole})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-slate-800">{deleteTargetLog.action}</span>
              </div>
              <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600 font-sans">
                {deleteTargetLog.details}
              </div>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
              Are you sure you want to delete this log? This action is permanent and cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetLog(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Multiple Bulk Delete Confirmation */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Selected Audit Records</h3>
                <p className="text-xs text-slate-500">Bulk delete {selectedIds.size} chosen audit entries.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to permanently delete <strong className="text-slate-900">{selectedIds.size}</strong> selected audit log entries.
            </p>

            <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs font-semibold">
              Warning: Deleted audit logs cannot be recovered. Ensure you have exported a CSV copy if required for compliance.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Delete {selectedIds.size} Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Master Purge Confirmation */}
      {masterPurgeModal && masterPurgeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{masterPurgeModal.title}</h3>
                <p className="text-xs text-slate-500">Master audit trail maintenance operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{masterPurgeModal.description}</p>

            <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs font-bold">
              Irreversible Action: Once confirmed, the specified audit logs will be permanently deleted from database storage.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMasterPurgeModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={masterPurgeModal.action}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Confirm & Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
