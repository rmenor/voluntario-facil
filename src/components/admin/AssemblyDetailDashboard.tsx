
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/layout/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, CalendarClock, ChevronLeft, Calendar, MapPin } from 'lucide-react';
import type { Position, PopulatedShift, User, PopulatedAssembly } from '@/lib/types';
import VolunteersTab from './VolunteersTab';
import ShiftsTab from './ShiftsTab';
import PositionsTab from './PositionsTab';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AssemblyDetailDashboardProps {
  assembly: PopulatedAssembly;
  initialShifts: PopulatedShift[];
  initialVolunteers: User[];
  allUsers: User[];
  allPositions: Position[];
}

export default function AssemblyDetailDashboard({ assembly, initialShifts, initialVolunteers, allUsers, allPositions }: AssemblyDetailDashboardProps) {
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
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-2 -ml-4">
                    <Link href="/admin">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Volver a Asambleas
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">{assembly.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(assembly.startDate), "d MMM", {locale: es})} - {format(new Date(assembly.endDate), "d MMM, yyyy", {locale: es})}</span>
                </div>
            </div>

          <Tabs defaultValue="shifts">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 sm:w-auto">
              <TabsTrigger value="shifts"><CalendarClock className="mr-2 h-4 w-4"/>Turnos</TabsTrigger>
              <TabsTrigger value="volunteers"><Users className="mr-2 h-4 w-4"/>Voluntarios</TabsTrigger>
              <TabsTrigger value="positions"><MapPin className="mr-2 h-4 w-4"/>Posiciones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shifts" className="mt-6">
                <ShiftsTab initialShifts={initialShifts} positions={allPositions} volunteers={initialVolunteers} assembly={assembly}/>
            </TabsContent>
            <TabsContent value="volunteers" className="mt-6">
                <VolunteersTab assembly={assembly} allUsers={allUsers} volunteers={initialVolunteers} />
            </TabsContent>
            <TabsContent value="positions" className="mt-6">
                <PositionsTab initialPositions={allPositions} assembly={assembly} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
