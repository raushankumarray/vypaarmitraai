'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Company, UserRole } from '@/types';
import { localStore } from '@/lib/store/localStore';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (
    identifier: string,
    channel: 'EMAIL' | 'WHATSAPP'
  ) => Promise<{
    success: boolean;
    error?: string;
    maskedTarget?: string;
    channel?: string;
    expiresAt?: number;
    previewCode?: string;
    whatsappUrl?: string;
  }>;
  loginWithOtp: (identifier: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (newPass: string) => Promise<boolean>;
  refreshTenant: () => void;
  hasPermission: (permission: string) => boolean;
  hasModule: (moduleKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  SUPER_ADMIN: '/superadmin',
  MERCHANT: '/merchant',
  EMPLOYEE: '/employee',
  SUPPORT: '/support',
  DEVELOPER: '/developer',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadSession = () => {
    try {
      const storedUserId = localStorage.getItem('vypaarmitra_uid');
      if (storedUserId) {
        const u = localStore.getUser(storedUserId);
        if (u && (u.status === 'ACTIVE' || u.status === 'PENDING_SETUP')) {
          setUser(u);
          setMustChangePassword(Boolean(u.mustChangePassword));
          if (u.companyId) {
            const comp = localStore.getCompany(u.companyId);
            setCompany(comp || null);
          }
        } else {
          localStorage.removeItem('vypaarmitra_uid');
          setUser(null);
          setCompany(null);
        }
      }
    } catch (e) {
      console.warn('Session load error', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    const unsub = localStore.subscribe(() => {
      if (user) {
        const updated = localStore.getUser(user.id);
        if (updated) {
          setUser({ ...updated });
          setMustChangePassword(Boolean(updated.mustChangePassword));
          if (updated.companyId) {
            setCompany(localStore.getCompany(updated.companyId) || null);
          }
        }
      }
    });
    return () => unsub();
  }, [user]);

  // Route protection and panel guard
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/force-password-change' || pathname === '/';

    if (!user) {
      if (!isAuthRoute) {
        router.replace('/login');
      }
      return;
    }

    // Force Password Change Check
    if (mustChangePassword) {
      if (pathname !== '/force-password-change') {
        router.replace('/force-password-change');
      }
      return;
    }

    // Role-based route protection: prevent manual URL tampering
    const expectedPrefix = ROLE_ROUTE_PREFIX[user.role];
    const isInsideOtherPanel = Object.entries(ROLE_ROUTE_PREFIX).some(
      ([role, prefix]) => role !== user.role && pathname.startsWith(prefix)
    );

    if (isInsideOtherPanel || pathname === '/login' || pathname === '/force-password-change' || pathname === '/') {
      router.replace(expectedPrefix);
    }
  }, [user, isLoading, mustChangePassword, pathname, router]);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Authoritative server-side master database authentication across all devices
      try {
        const res = await fetch('/api/system/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'AUTH',
            identifier,
            password: pass,
          }),
        });

        const data = await res.json();
        if (data && data.success && data.user) {
          // Hydrate localStore with the authoritative master database state
          if (data.masterState) {
            localStore.applyMasterState(data.masterState);
          }

          const authedUser = data.user;
          const requiredChange = Boolean(data.mustChangePassword);

          setUser(authedUser);
          setMustChangePassword(requiredChange);
          localStorage.setItem('vypaarmitra_uid', authedUser.id);

          if (data.company) {
            setCompany(data.company);
          } else if (authedUser.companyId) {
            const comp = localStore.getCompany(authedUser.companyId);
            setCompany(comp || null);
          }

          if (requiredChange) {
            router.push('/force-password-change');
          } else {
            router.push(ROLE_ROUTE_PREFIX[authedUser.role as UserRole] || '/superadmin');
          }

          return { success: true };
        } else if (data && data.error && !data.message?.includes('Server error')) {
          // Authoritative error from master DB (e.g., incorrect password, account suspended)
          return { success: false, error: data.error };
        }
      } catch (serverErr) {
        console.warn('[Auth] Server-side auth request fallback to local sync', serverErr);
      }

      // 2. Offline / local fallback
      let authResult = localStore.authenticateUser(identifier, pass);
      if (!authResult) {
        await localStore.syncWithServerAndCloud();
        authResult = localStore.authenticateUser(identifier, pass);
      }

      if (!authResult) {
        return { success: false, error: 'Invalid credentials or account is suspended.' };
      }

      const { user: authedUser, mustChangePassword: requiredChange } = authResult;
      setUser(authedUser);
      setMustChangePassword(requiredChange);
      localStorage.setItem('vypaarmitra_uid', authedUser.id);

      if (authedUser.companyId) {
        const comp = localStore.getCompany(authedUser.companyId);
        setCompany(comp || null);
      }

      if (requiredChange) {
        router.push('/force-password-change');
      } else {
        router.push(ROLE_ROUTE_PREFIX[authedUser.role]);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const requestOtp = async (identifier: string, channel: 'EMAIL' | 'WHATSAPP') => {
    return await localStore.generateLoginOtp(identifier, channel);
  };

  const loginWithOtp = async (identifier: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const verifyResult = await localStore.verifyLoginOtp(identifier, otp);
      if (!verifyResult.success || !verifyResult.user) {
        return { success: false, error: verifyResult.error || 'Verification failed. Please check the OTP code.' };
      }

      const authedUser = verifyResult.user;
      const requiredChange = Boolean(verifyResult.mustChangePassword);

      setUser(authedUser);
      setMustChangePassword(requiredChange);
      localStorage.setItem('vypaarmitra_uid', authedUser.id);

      if (authedUser.companyId) {
        const comp = localStore.getCompany(authedUser.companyId);
        setCompany(comp || null);
      }

      if (requiredChange) {
        router.push('/force-password-change');
      } else {
        router.push(ROLE_ROUTE_PREFIX[authedUser.role]);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'OTP authentication failed' };
    }
  };

  const logout = () => {
    if (user) {
      localStore.addAuditLog({
        companyId: user.companyId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGOUT',
        module: 'auth',
        entityType: 'user',
        entityId: user.id,
        details: `User ${user.username} signed out`,
      });
    }
    localStorage.removeItem('vypaarmitra_uid');
    setUser(null);
    setCompany(null);
    setMustChangePassword(false);
    router.replace('/login');
  };

  const updatePassword = async (newPass: string): Promise<boolean> => {
    if (!user) return false;

    // 1. Update in local store
    const ok = localStore.changeUserPassword(user.id, newPass);

    // 2. Persist to server master database immediately across all devices
    try {
      await fetch('/api/system/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PASSWORD',
          userId: user.id,
          password: newPass,
          mustChangePassword: false,
        }),
      });
    } catch (e) {
      console.warn('[Auth] Update password server sync notice:', e);
    }

    if (ok) {
      setMustChangePassword(false);
      setUser({ ...user, mustChangePassword: false });
      router.replace(ROLE_ROUTE_PREFIX[user.role]);
      return true;
    }
    return false;
  };

  const refreshTenant = () => {
    if (user?.companyId) {
      const comp = localStore.getCompany(user.companyId);
      setCompany(comp || null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const hasModule = (moduleKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (!company) return false;
    return company.enabledModules.includes(moduleKey as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: Boolean(user),
        isLoading,
        mustChangePassword,
        login,
        requestOtp,
        loginWithOtp,
        logout,
        updatePassword,
        refreshTenant,
        hasPermission,
        hasModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
