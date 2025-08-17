
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/layout/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, CalendarClock, ChevronLeft, Calendar, MapPin, Pencil } from 'lucide-react';
import type { Position, PopulatedShift, User, PopulatedAssembly } from '@/lib/types';
import VolunteersTab from './VolunteersTab';
import ShiftsTab from './ShiftsTab';
import PositionsTab from './PositionsTab';
import { Button } from '../ui/button';
import { format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { updateAssembly } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

function EditAssemblyForm({ assembly, closeDialog }: { assembly: PopulatedAssembly, closeDialog: () => void}) {
    const [state, formAction] = useActionState(updateAssembly, { success: false, error: null, message: null });
    const { toast } = useToast();

    useEffect(() => {
        if(state.success) {
            toast({ title: "Éxito", description: state.message });
            closeDialog();
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, closeDialog]);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="assemblyId" value={assembly.id} />
            {assembly.volunteerIds.map(id => <input key={id} type="hidden" name="volunteerIds" value={id} />)}
            
            <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required defaultValue={assembly.title} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup name="type" defaultValue={assembly.type} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regional" id="edit-type-regional" />
                  <Label htmlFor="edit-type-regional" className="font-normal">Regional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="circuito" id="edit-type-circuito" />
                  <Label htmlFor="edit-type-circuito" className="font-normal">Circuito</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input id="startDate" name="startDate" type="date" required defaultValue={formatISO(assembly.startDate, { representation: 'date' })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input id="endDate" name="endDate" type="date" required defaultValue={formatISO(assembly.endDate, { representation: 'date' })} />
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
              <SubmitButton />
            </DialogFooter>
        </form>
    );
}

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
  const [isEditOpen, setEditOpen] = useState(false);

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
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold font-headline">{assembly.title}</h1>
                  <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar Asamblea</span>
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Editar Asamblea</DialogTitle>
                          </DialogHeader>
                          <EditAssemblyForm assembly={assembly} closeDialog={() => setEditOpen(false)} />
                      </DialogContent>
                  </Dialog>
                </div>
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
                <VolunteersTab assembly={assembly} volunteers={initialVolunteers} allUsers={allUsers} />
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
