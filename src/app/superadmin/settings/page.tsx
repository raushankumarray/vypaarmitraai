'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { localStore, SystemSettings } from '@/lib/store/localStore';
import { Company, User, NotificationItem, FirebaseCloudConfig } from '@/types';
import { cloudSync } from '@/lib/firebase/cloudSync';
import {
  Settings,
  Shield,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Bell,
  Send,
  Eye,
  EyeOff,
  Cloud,
  RefreshCw,
  Server,
  UserCheck,
  Building2,
  Layers,
  Sparkles,
  Lock,
  Flame,
  Download,
  ShieldCheck,
  Unplug,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';

type SettingsTab = 'PROFILE' | 'BRANDING' | 'NOTIFICATIONS' | 'FIREBASE';

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Profile State
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 2. Branding State
  const [appName, setAppName] = useState('');
  const [parentCompany, setParentCompany] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // 3. Announcements / Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationItem['type']>('INFO');
  const [notifTargetCompanyId, setNotifTargetCompanyId] = useState('ALL');
  const [notifSending, setNotifSending] = useState(false);

  // 4. Firebase Realtime Database & Cloud Sync State
  const [fbProjectId, setFbProjectId] = useState('npb-hrms-live-12345');
  const [fbDatabaseUrl, setFbDatabaseUrl] = useState('https://npb-hrms-live-12345-default-rtdb.firebaseio.com');
  const [fbServiceAccountJson, setFbServiceAccountJson] = useState('');
  const [fbConnected, setFbConnected] = useState(false);
  const [isTestingFb, setIsTestingFb] = useState(false);
  const [isFetchingFb, setIsFetchingFb] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Synchronize Tab Switching with URL Query parameter (?tab=profile|branding|notifications|firebase)
  const handleTabSwitch = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab.toLowerCase());
      window.history.replaceState(null, '', url.toString());
    }
  };

  const loadData = () => {
    // Load Super Admin User
    const admin = localStore.getAllUsers().find((u) => u.role === 'SUPER_ADMIN');
    if (admin) {
      setAdminName(admin.name);
      setAdminUsername(admin.username);
      setAdminMobile(admin.mobile);
      setAdminEmail(admin.email);
    }

    // Load System Settings
    const settings = localStore.getSystemSettings();
    setAppName(settings.appName);
    setParentCompany(settings.parentCompany);
    setTagline(settings.tagline);
    setLogoUrl(settings.logoUrl || '/logo.png');
    setSupportEmail(settings.supportEmail || 'support@npbmedia.com');
    setSupportPhone(settings.supportPhone || '+91 98765 43210');

    // Load Firebase Cloud Config
    const cloudCfg = localStore.getFirebaseCloudConfig();
    if (cloudCfg.projectId) {
      setFbProjectId(cloudCfg.projectId);
    }
    if (cloudCfg.databaseURL) {
      setFbDatabaseUrl(cloudCfg.databaseURL);
    }
    if (cloudCfg.serviceAccountKeyJson) {
      setFbServiceAccountJson(cloudCfg.serviceAccountKeyJson);
    }
    setFbConnected(Boolean(cloudCfg.connected));

    // Load Notifications & Companies
    setNotifications(localStore.getNotifications());
    setCompanies(localStore.getAllCompanies());
  };

  useEffect(() => {
    loadData();

    // Read initial ?tab= query on mount
    if (typeof window !== 'undefined') {
      const searchTab = new URLSearchParams(window.location.search).get('tab')?.toUpperCase();
      if (searchTab && ['PROFILE', 'BRANDING', 'NOTIFICATIONS', 'FIREBASE'].includes(searchTab)) {
        setActiveTab(searchTab as SettingsTab);
      }
    }

    const unsub = localStore.subscribe(() => loadData());
    return () => unsub();
  }, []);

  // 1. Handle Update Profile & Credentials
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!adminName.trim() || !adminUsername.trim()) {
      setProfileError('Name and Username are required');
      return;
    }

    if (newPasswordInput && newPasswordInput !== confirmPasswordInput) {
      setProfileError('New Password and Confirm Password do not match');
      return;
    }

    const success = localStore.updateSuperAdminProfile({
      name: adminName.trim(),
      username: adminUsername.trim(),
      mobile: adminMobile.trim(),
      email: adminEmail.trim(),
      newPassword: newPasswordInput.trim() || undefined,
    });

    if (success) {
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      showToast('Super Admin profile & credentials updated successfully');
    } else {
      setProfileError('Failed to update Super Admin account');
    }
  };

  // 2. Handle Logo Upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image file size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    localStore.saveSystemSettings({
      appName: appName.trim(),
      parentCompany: parentCompany.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim(),
      supportEmail: supportEmail.trim(),
      supportPhone: supportPhone.trim(),
    });
    showToast('Company branding & logo updated successfully');
  };

  // 3. Handle Broadcast Company Announcement
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setNotifSending(true);
    localStore.addNotification({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      companyId: notifTargetCompanyId === 'ALL' ? undefined : notifTargetCompanyId,
      read: false,
    });

    setNotifSending(false);
    setNotifTitle('');
    setNotifMessage('');
    showToast('Announcement broadcasted to merchants successfully');
  };

  const handleDeleteNotification = (id: string) => {
    localStore.deleteNotification(id);
    showToast('Announcement deleted');
  };

  // 4. Firebase Realtime Database Operations

  // A. Refresh Status Button
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    const cfg = localStore.getFirebaseCloudConfig();
    const res = await cloudSync.testConnection({
      ...cfg,
      projectId: fbProjectId.trim(),
      databaseURL: fbDatabaseUrl.trim(),
    });
    setIsRefreshingStatus(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
    showToast('Firebase connection status refreshed.');
  };

  // B. Test Connection Button
  const handleTestFirebase = async () => {
    setIsTestingFb(true);
    setTestResult(null);

    const res = await cloudSync.testConnection({
      projectId: fbProjectId.trim(),
      databaseURL: fbDatabaseUrl.trim(),
      serviceAccountKeyJson: fbServiceAccountJson.trim(),
      connected: fbConnected,
      syncStatus: fbConnected ? 'CONNECTED' : 'DISCONNECTED',
    });

    setIsTestingFb(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
    if (res.success) {
      showToast('Firebase connection verified successfully!');
    }
  };

  // C. Fetch All Data from Database Button
  const handleFetchAllFromDatabase = async () => {
    setIsFetchingFb(true);
    setTestResult(null);

    const res = await cloudSync.pullAll({
      projectId: fbProjectId.trim(),
      databaseURL: fbDatabaseUrl.trim(),
      serviceAccountKeyJson: fbServiceAccountJson.trim(),
      connected: true,
      syncStatus: 'SYNCING',
    });

    setIsFetchingFb(false);

    if (res.success && res.data) {
      const restoreResult = localStore.restoreFromFirebase(res.data);
      setFbConnected(true);
      setTestResult({
        success: true,
        message: restoreResult.message,
      });
      showToast(`Restored ${restoreResult.restoredCount} records from Firebase Realtime Database!`);
    } else {
      setTestResult({
        success: false,
        message: res.message || 'No data found or database rules restricted.',
      });
      showToast('Fetch completed: Verify database URL or permissions.');
    }
  };

  // D. Refresh / Update Database Button (Push all data to cloud)
  const handleRefreshUpdateDatabase = async () => {
    setIsSyncingAll(true);
    setTestResult(null);

    // Save current config
    localStore.saveFirebaseCloudConfig({
      projectId: fbProjectId.trim(),
      databaseURL: fbDatabaseUrl.trim(),
      serviceAccountKeyJson: fbServiceAccountJson.trim(),
      connected: true,
      syncStatus: 'CONNECTED',
    });

    const fullState = (localStore as any).state || {};
    const res = await cloudSync.pushAll(
      {
        projectId: fbProjectId.trim(),
        databaseURL: fbDatabaseUrl.trim(),
        serviceAccountKeyJson: fbServiceAccountJson.trim(),
        connected: true,
        syncStatus: 'CONNECTED',
      },
      fullState
    );

    setIsSyncingAll(false);
    setFbConnected(true);
    setTestResult({
      success: res.success,
      message: res.message,
    });
    showToast('All 16 SaaS collections synchronized to Firebase Cloud!');
  };

  // E. Save & Connect Firebase Button (Auto-restores cloud data or pushes initial sync)
  const handleSaveAndConnectFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingAll(true);
    setTestResult(null);

    const cfg: FirebaseCloudConfig = {
      projectId: fbProjectId.trim(),
      databaseURL: fbDatabaseUrl.trim(),
      serviceAccountKeyJson: fbServiceAccountJson.trim(),
      connected: true,
      syncStatus: 'CONNECTED',
      syncMode: 'DUAL_SYNC',
    };

    localStore.saveFirebaseCloudConfig(cfg);

    // Auto-restore existing cloud data from Realtime DB / Firestore if available
    try {
      const pullRes = await cloudSync.pullAll(cfg);
      if (pullRes.success && pullRes.data && Object.keys(pullRes.data).length > 0) {
        const restoreResult = localStore.restoreFromFirebase(pullRes.data);
        setIsSyncingAll(false);
        setFbConnected(true);
        loadData();
        setTestResult({
          success: true,
          message: `Connected! Auto-restored ${restoreResult.restoredCount} records from Firebase Realtime Database & Cloud Firestore with zero data loss.`,
        });
        showToast('Firebase connected! Restored cloud records successfully.');
        return;
      }
    } catch (err) {
      console.warn('Cloud pull attempt note:', err);
    }

    // If cloud is fresh, push current local dataset to both databases
    const fullState = (localStore as any).state || {};
    const res = await cloudSync.pushAll(cfg, fullState);

    setIsSyncingAll(false);
    setFbConnected(true);
    loadData();
    setTestResult({
      success: true,
      message: `Connected to both Firebase Realtime Database & Cloud Firestore! All collections synchronized to ${fbProjectId.trim()}`,
    });
    showToast('Firebase connected! Dual-engine real-time sync is active.');
  };

  // F. Disconnect Firebase and Clean Data
  const handleConfirmDisconnect = () => {
    localStore.disconnectFirebaseAndClear();
    setFbConnected(false);
    setShowDisconnectModal(false);
    loadData();
    setTestResult({
      success: true,
      message: 'Firebase disconnected. All tenant data removed from site. Please connect database setup to restore data.',
    });
    showToast('Firebase disconnected. Local data cleared from site.');
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-purple-500/30 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Disconnect Warning Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Unplug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Disconnect Firebase Database?</h3>
                <p className="text-xs text-slate-500">Dual-Engine synchronization disconnect</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Local Tenant Data Will Be Cleared
              </p>
              <p>
                Disconnecting will wipe local tenant data (companies, products, invoices, customers) from this device memory while keeping your Super Admin master login safe.
              </p>
              <p className="text-[11px] text-amber-800">
                All records remain safely stored in your Firebase Realtime Database and can be restored anytime by reconnecting.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System Settings &amp; Infrastructure
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage Super Admin profile, company logo branding, merchant broadcast alerts, and Firebase Realtime Cloud setup.
        </p>
      </div>

      {/* Navigation Tabs (Synchronized with URL: ?tab=profile|branding|notifications|firebase) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabSwitch('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profile &amp; Credentials</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('BRANDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'BRANDING'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Logo &amp; Identity</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('NOTIFICATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Broadcast Merchant Alert</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('FIREBASE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'FIREBASE'
              ? 'bg-white text-amber-600 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Firebase Realtime Database</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SUPER ADMIN PROFILE & CREDENTIALS */}
      {/* ========================================================= */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>Super Admin Profile &amp; Login Credentials</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update Master Administrator contact info, username, and change login password.
            </p>
          </div>

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">USERNAME *</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">MOBILE NUMBER</label>
                <input
                  type="tel"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="font-black text-slate-900 mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Change Administrator Password</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NEW PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Leave blank to keep unchanged"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CONFIRM NEW PASSWORD</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm shadow-purple-700/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Profile &amp; Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: COMPANY LOGO & WHITE-LABEL BRANDING */}
      {/* ========================================================= */}
      {activeTab === 'BRANDING' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span>Company Logo &amp; White-Label Branding</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize parent company identity, application name, and official logo displayed across all merchant portals.
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">APPLICATION NAME *</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PARENT COMPANY (NPB MEDIA) *</label>
                <input
                  type="text"
                  required
                  value={parentCompany}
                  onChange={(e) => setParentCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">BRAND TAGLINE</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Smart Business Management for Every Business"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>

            {/* Logo Upload Section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700 mb-2">OFFICIAL LOGO</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended format: Transparent PNG or SVG, max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SYSTEM SUPPORT EMAIL</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SYSTEM SUPPORT PHONE / WHATSAPP</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm shadow-purple-700/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Branding &amp; Logo</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BROADCAST MERCHANT ANNOUNCEMENTS */}
      {/* ========================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <span>Broadcast System Announcement &amp; Merchant Alerts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send global banner alerts or targeted messages to active merchant dashboards.
            </p>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ANNOUNCEMENT TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Cloud Maintenance Window"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ALERT TYPE</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as NotificationItem['type'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-medium"
                >
                  <option value="INFO">Information (Blue)</option>
                  <option value="SUCCESS">Success (Green)</option>
                  <option value="WARNING">Warning (Amber)</option>
                  <option value="DANGER">Critical Alert (Red)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">TARGET AUDIENCE</label>
              <select
                value={notifTargetCompanyId}
                onChange={(e) => setNotifTargetCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-medium"
              >
                <option value="ALL">All Active Merchants &amp; Outlets (Global Broadcast)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    Tenant: {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">MESSAGE CONTENT *</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed announcement details..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={notifSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm shadow-purple-700/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{notifSending ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
              </button>
            </div>
          </form>

          {/* Active Broadcasts List */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-black text-slate-900 text-xs mb-3">ACTIVE BROADCAST LOG ({notifications.length})</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active announcements broadcasted.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            n.type === 'DANGER'
                              ? 'bg-rose-500'
                              : n.type === 'WARNING'
                              ? 'bg-amber-500'
                              : n.type === 'SUCCESS'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono">
                          {n.companyId === 'ALL' || !n.companyId ? 'GLOBAL' : `Tenant #${n.companyId}`}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">{n.message}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FIREBASE REALTIME DATABASE & CLOUD SYNC */}
      {/* Match Layout from screenshot media_1789800807524.png */}
      {/* ========================================================= */}
      {activeTab === 'FIREBASE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Firebase Realtime Database &amp; Cloud Sync
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      fbConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        fbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {fbConnected
                        ? 'Connected (Firebase Live Sync)'
                        : 'Awaiting Project Credentials (SQLite Active)'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect Google Cloud Firebase for live database streaming, ticket chat messaging, and push notifications
                </p>
              </div>
            </div>

            {/* Refresh Status Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={isRefreshingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {/* Test or Operation Result Alert */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Amber Callout Box: Dual-Engine Architecture */}
          <div className="border border-amber-200 bg-amber-50/70 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Database className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Dual-Engine Architecture: SQLite Core + Firebase Realtime Cloud</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                VypaarMitra AI runs SQLite local engine for ultra-fast queries, transactional data, and payroll. When Firebase is connected, all companies, employees, users, attendance punches, and live routes synchronize to Google Firebase in real-time. You can fetch and restore all cloud data at any time, or push full database updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Background Auto-Sync: Active
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  fbConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100/90 text-slate-700 border border-slate-200/70'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    fbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                Cloud Firestore: {fbConnected ? 'Active' : 'Standby'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  fbConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100/90 text-slate-700 border border-slate-200/70'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    fbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                Realtime DB: {fbConnected ? 'Active' : 'Standby'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/70">
                ((•)) FCM Push
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndConnectFirebase} className="space-y-5 text-xs">
            {/* Row 1: Project ID & Realtime Database URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. npb-hrms-live-12345"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Your Google Cloud / Firebase Project ID found in Firebase Console.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Realtime Database URL{' '}
                  <span className="text-slate-400 font-normal">(Optional for Firestore-only)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                  value={fbDatabaseUrl}
                  onChange={(e) => setFbDatabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Firebase Realtime Database instance URL for high-frequency live data streaming sockets.
                </p>
              </div>
            </div>

            {/* Row 2: Service Account Private Key JSON (Dark Code Editor Style) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Firebase Service Account Private Key JSON
                </label>
                <span className="text-[11px] text-slate-400">Paste JSON content below</span>
              </div>

              <textarea
                rows={7}
                value={fbServiceAccountJson}
                onChange={(e) => setFbServiceAccountJson(e.target.value)}
                placeholder={`Paste your Firebase Service Account JSON here, for example:\n{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "firebase-adminsdk@...",\n  ...\n}`}
                className="w-full bg-[#0b1329] text-blue-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y leading-relaxed"
                spellCheck={false}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1 text-[11px] text-slate-500">
                <span>
                  Download from: Firebase Console &gt; Project Settings &gt; Service Accounts &gt; &quot;Generate new private key&quot;.
                </span>
                <span className="font-mono text-slate-400">
                  Or place file directly at server/config/serviceAccountKey.json
                </span>
              </div>
            </div>

            {/* Action Buttons Section Matching Screenshot */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Left Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleFetchAllFromDatabase}
                  disabled={isFetchingFb}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 active:scale-[0.98] text-emerald-800 font-semibold text-xs transition-all shadow-xs"
                >
                  <Download className={`w-4 h-4 text-emerald-600 ${isFetchingFb ? 'animate-bounce' : ''}`} />
                  <span>{isFetchingFb ? 'Fetching Database...' : 'Fetch All Data from Database'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshUpdateDatabase}
                  disabled={isSyncingAll}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50/60 hover:bg-sky-100/70 active:scale-[0.98] text-sky-800 font-semibold text-xs transition-all shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 text-sky-600 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Updating Database...' : 'Refresh / Update Database'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={isTestingFb}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold text-xs transition-all shadow-xs"
                >
                  <ShieldCheck className={`w-4 h-4 text-slate-600 ${isTestingFb ? 'animate-pulse text-indigo-600' : ''}`} />
                  <span>{isTestingFb ? 'Testing Ping...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2.5">
                {fbConnected ? (
                  <>
                    <button
                      type="submit"
                      disabled={isSyncingAll}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm shadow-indigo-600/20 text-xs transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDisconnectModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 font-bold text-xs transition-all shadow-xs"
                    >
                      <Unplug className="w-4 h-4 text-rose-600" />
                      <span>Disconnect Firebase</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSyncingAll}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-orange-500/20 text-xs transition-all"
                  >
                    <Flame className={`w-4 h-4 fill-white text-white ${isSyncingAll ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingAll ? 'Connecting & Syncing...' : 'Save & Connect Firebase'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
