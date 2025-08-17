'use client';

import { useMemo, useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import * as LucideIcons from 'lucide-react';
import type { PopulatedShift, PopulatedAssembly, User } from '@/lib/types';
import AppHeader from '@/components/layout/AppHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, Loader2, XCircle, CheckCircle, AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { rejectShift as rejectShiftAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { getPopulatedShifts } from '@/lib/data';


function RejectSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Rechazando...' : 'Confirmar Rechazo'}
    </Button>
  );
}

function RejectShiftForm({ shift, user, closeDialog, onShiftRejected }: { shift: PopulatedShift; user: User, closeDialog: () => void, onShiftRejected: (rejectedShift: PopulatedShift) => void }) {
  const [state, formAction] = useActionState(rejectShiftAction, { success: false, error: null, message: null });
  const { toast } = useToast();

  useEffect(() => {
    if(state.success) {
      toast({ title: "Éxito", description: state.message });
      onShiftRejected(shift);
      closeDialog();
    } else if (state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, closeDialog, shift, onShiftRejected]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="shiftId" value={shift.id} />
      <input type="hidden" name="volunteerId" value={user.id} />
      <input type="hidden" name="assemblyId" value={shift.assemblyId} />
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo del rechazo (opcional)</Label>
        <Textarea id="reason" name="reason" placeholder="Ej: Tengo un compromiso previo..." />
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
        <RejectSubmitButton />
      </DialogFooter>
    </form>
  )
}

export default function ScheduleView({ shifts: initialShifts }: { shifts: PopulatedShift[], assemblies: PopulatedAssembly[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [rejectingShift, setRejectingShift] = useState<PopulatedShift | null>(null);
  const [shifts, setShifts] = useState(initialShifts);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  useEffect(() => {
    setShifts(initialShifts);
  }, [initialShifts]);

  const handleShiftRejected = (rejectedShift: PopulatedShift) => {
    setShifts(currentShifts =>
        currentShifts.map(s =>
            s.id === rejectedShift.id
                ? { ...s, volunteerId: null, volunteer: null, rejectionReason: 'Rechazado por usuario', rejectedBy: user?.id }
                : s
        )
    );
  };

  const myShifts = useMemo(() => {
    if (!user) return [];
    return shifts
        .filter(shift => shift.volunteer?.id === user?.id || shift.rejectedBy === user.id)
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [shifts, user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const getStatusContent = (shift: PopulatedShift) => {
    if (shift.rejectedBy === user.id || (shift.rejectionReason && shift.volunteerId === null)) {
        return (
            <div className="flex flex-col gap-1">
                <Badge variant="destructive" className="w-fit"><XCircle className="mr-1 h-3 w-3" />Rechazado</Badge>
                {shift.rejectionReason && shift.rejectionReason !== 'Sin motivo' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span className="italic">"{shift.rejectionReason}"</span>
                  </div>
                )}
            </div>
        )
    }
    if (shift.volunteerId) {
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Confirmado</Badge>;
    }
    return <Badge variant="secondary"><HelpCircle className="mr-1 h-3 w-3" />Pendiente</Badge>;
};

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Hola, {user.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground capitalize">Bienvenido a tu panel de voluntario.</p>
            </div>

            <div className="grid gap-8">
            <div className="">
                <Card>
                    <CardHeader>
                        <CardTitle>Mis Próximos Turnos</CardTitle>
                        <CardDescription>Estos son los turnos que tienes asignados.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {myShifts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asamblea</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Posición</TableHead>
                                            <TableHead>Horario</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myShifts.map(shift => {
                                            const Icon = LucideIcons[shift.position.iconName as keyof typeof LucideIcons] as React.ElementType;
                                            return (
                                            <TableRow key={shift.id} className={shift.rejectedBy === user.id ? 'bg-destructive/10' : ''}>
                                                <TableCell className="font-medium">{shift.assembly.title}</TableCell>
                                                <TableCell>{format(new Date(shift.startTime), 'eeee, dd/MM', {locale: es})}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                                                        {shift.position.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}</TableCell>
                                                <TableCell>{getStatusContent(shift)}</TableCell>
                                                <TableCell className="text-right">
                                                    {shift.volunteerId === user.id && (
                                                        <Button variant="outline" size="sm" onClick={() => setRejectingShift(shift)}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Rechazar
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4">
                                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h2 className="text-xl font-semibold">No tienes turnos asignados</h2>
                                <p className="text-muted-foreground mt-2">Pronto se publicarán nuevos turnos. ¡Mantente atento!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            </div>
        </div>
      </main>
      
      <Dialog open={!!rejectingShift} onOpenChange={(isOpen) => !isOpen && setRejectingShift(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rechazar Turno</DialogTitle>
                <DialogDescription>
                    ¿Estás seguro de que quieres rechazar este turno? El administrador será notificado.
                </DialogDescription>
            </DialogHeader>
            {rejectingShift && <RejectShiftForm shift={rejectingShift} user={user} closeDialog={() => setRejectingShift(null)} onShiftRejected={handleShiftRejected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
