'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { BrandName } from '@/components/common/BrandName';

export default function RootPage() {
  const { user, isLoading, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (mustChangePassword) {
        router.replace('/force-password-change');
      } else {
        switch (user.role) {
          case 'SUPER_ADMIN':
            router.replace('/superadmin');
            break;
          case 'MERCHANT':
            router.replace('/merchant');
            break;
          case 'EMPLOYEE':
            router.replace('/employee');
            break;
          case 'SUPPORT':
            router.replace('/support');
            break;
          case 'DEVELOPER':
            router.replace('/developer');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [user, isLoading, mustChangePassword, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-16 h-16 flex items-center justify-center mb-4 animate-bounce">
        <img src="/logo.png" alt="VypaarMitra Logo" className="w-full h-full object-contain" />
      </div>
      <BrandName size="xl" theme="dark" />
      <p className="text-sm text-slate-400 mt-1">Smart Business Management for Every Business</p>
      <div className="flex items-center gap-2 mt-6 text-sm text-blue-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Initializing application...</span>
      </div>
    </div>
  );
}
