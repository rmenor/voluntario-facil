'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/layout/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, MapPin, CalendarClock, GalleryVerticalEnd } from 'lucide-react';
import type { Position, PopulatedShift, User, PopulatedAssembly } from '@/lib/types';
import VolunteersTab from './VolunteersTab';
import PositionsTab from './PositionsTab';
import ShiftsTab from './ShiftsTab';
import AssembliesTab from './AssembliesTab';

interface AdminDashboardProps {
  initialUsers: User[];
  initialPositions: Position[];
  initialShifts: PopulatedShift[];
  initialAssemblies: PopulatedAssembly[];
}

export default function AdminDashboard({ initialUsers, initialPositions, initialShifts, initialAssemblies }: AdminDashboardProps) {
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

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold font-headline mb-6">Panel de Administración</h1>
          <Tabs defaultValue="assemblies">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto">
              <TabsTrigger value="assemblies"><GalleryVerticalEnd className="mr-2 h-4 w-4"/>Asambleas</TabsTrigger>
              <TabsTrigger value="shifts"><CalendarClock className="mr-2 h-4 w-4"/>Turnos</TabsTrigger>
              <TabsTrigger value="volunteers"><Users className="mr-2 h-4 w-4"/>Voluntarios</TabsTrigger>
              <TabsTrigger value="positions"><MapPin className="mr-2 h-4 w-4"/>Posiciones</TabsTrigger>
            </TabsList>
            <TabsContent value="assemblies" className="mt-6">
                <AssembliesTab initialAssemblies={initialAssemblies} volunteers={initialUsers} />
            </TabsContent>
            <TabsContent value="shifts" className="mt-6">
                <ShiftsTab initialShifts={initialShifts} positions={initialPositions} volunteers={initialUsers} assemblies={initialAssemblies} />
            </TabsContent>
            <TabsContent value="volunteers" className="mt-6">
                <VolunteersTab initialUsers={initialUsers.filter(u => u.id !== user.id)} />
            </TabsContent>
            <TabsContent value="positions" className="mt-6">
                <PositionsTab initialPositions={initialPositions} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
