
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/layout/AppHeader';
import { Loader2, GalleryVerticalEnd } from 'lucide-react';
import type { PopulatedAssembly, User } from '@/lib/types';
import AssembliesTab from './AssembliesTab';
import AdminDashboard from './AdminDashboard';

interface AssembliesDashboardProps {
  initialAssemblies: PopulatedAssembly[];
}

export default function AssembliesDashboard({ initialAssemblies }: AssembliesDashboardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user || user.role !== 'admin') {
     return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // A simple way to get all users without duplicates
  const allUsers = initialAssemblies.reduce((acc, assembly) => {
    assembly.volunteers.forEach(v => {
      if (!acc.find(u => u.id === v.id)) {
        acc.push(v);
      }
    });
    return acc;
  }, [] as User[]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
          </div>
          <AssembliesTab initialAssemblies={initialAssemblies} volunteers={allUsers} />
        </div>
      </main>
    </div>
  );
}
