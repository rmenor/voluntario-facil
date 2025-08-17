'use client';
import { useActionState, useEffect, useState, useRef, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

import type { PopulatedShift, Position, User, PopulatedAssembly } from '@/lib/types';
import { addShift, assignVolunteerToShift } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Clock, User as UserIcon, AlertCircle, CheckCircle, HelpCircle, XCircle, AlertTriangle, Printer } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUser } from '@/lib/data';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creando...' : 'Crear Turno'}
    </Button>
  );
}

const getStatusBadge = (shift: PopulatedShift) => {
    if (shift.rejectionReason) {
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rechazado</Badge>;
    }
    if (shift.volunteerId) {
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Confirmado</Badge>;
    }
    return <Badge variant="secondary"><HelpCircle className="mr-1 h-3 w-3" />Pendiente</Badge>;
};

function RejectionNote({ shift }: { shift: PopulatedShift }) {
    const [rejectedBy, setRejectedBy] = useState<User | null>(null);

    useEffect(() => {
        if (shift.rejectionReason && shift.rejectedBy) {
            getUser(shift.rejectedBy).then(user => setRejectedBy(user));
        }
    }, [shift.rejectedBy, shift.rejectionReason]);

    if (!shift.rejectionReason || !rejectedBy) return <span>-</span>;
    
    return (
        <TooltipProvider>
            <Tooltip>
            <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive"/>
                    Por {rejectedBy.name.split(' ')[0]}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-semibold">Rechazado por: {rejectedBy.name}</p>
                 {shift.rejectionReason !== 'Sin motivo' && <p>Motivo: {shift.rejectionReason}</p>}
            </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}


export default function ShiftsTab({ initialShifts, positions, volunteers, assemblies }: { initialShifts: PopulatedShift[], positions: Position[], volunteers: User[], assemblies: PopulatedAssembly[] }) {
  const [state, formAction] = useActionState(addShift, { success: false, error: null, message: null });
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedAssembly, setSelectedAssembly] = useState<string>('all');
  const [selectedAssemblyForCreation, setSelectedAssemblyForCreation] = useState<string | null>(assemblies[0]?.id || null);
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Éxito', description: state.message });
      setOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast]);

  const handleAssignVolunteer = (shiftId: string, volunteerId: string) => {
    startTransition(async () => {
      const result = await assignVolunteerToShift(shiftId, volunteerId === 'null' ? null : volunteerId);
      if (result.success) {
        toast({ title: 'Éxito', description: 'Voluntario asignado correctamente.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handlePrint = () => {
    const url = `/admin/print?assemblyId=${selectedAssembly}`;
    window.open(url, '_blank');
  }

  const filteredShifts = useMemo(() => {
    if (selectedAssembly === 'all') return initialShifts;
    return initialShifts.filter(shift => shift.assemblyId === selectedAssembly);
  }, [initialShifts, selectedAssembly]);
  
  const assemblyVolunteers = useMemo(() => {
    if (!selectedAssemblyForCreation) return [];
    const assembly = assemblies.find(a => a.id === selectedAssemblyForCreation);
    return assembly ? assembly.volunteers : [];
  }, [selectedAssemblyForCreation, assemblies]);
  
  const getVolunteersForShiftAssembly = (shift: PopulatedShift) => {
    const assembly = assemblies.find(a => a.id === shift.assemblyId);
    return assembly ? assembly.volunteers : [];
  }


  const getDaysForAssembly = (assemblyId: string | null) => {
    if (!assemblyId) return [];
    const assembly = assemblies.find(a => a.id === assemblyId);
    if (!assembly) return [];

    const days = [];
    let currentDate = new Date(assembly.startDate);
    const endDate = new Date(assembly.endDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }

  const renderMobileView = () => (
     <div className="space-y-4">
        {filteredShifts.map(shift => {
          const Icon = LucideIcons[shift.position.iconName as keyof typeof LucideIcons] as React.ElementType;
          const shiftAssemblyVolunteers = getVolunteersForShiftAssembly(shift);
          return (
            <Card key={shift.id} className={shift.rejectionReason ? 'border-destructive/50' : ''}>
              <CardHeader>
                <div className='flex justify-between items-start'>
                    <CardTitle className="flex items-center gap-2 text-base">
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                        {shift.position.name}
                    </CardTitle>
                    {getStatusBadge(shift)}
                </div>
                <CardDescription>
                  {format(shift.startTime, "eeee, d 'de' MMMM", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className='flex items-center text-sm'>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{format(shift.startTime, 'HH:mm')} - {format(shift.endTime, 'HH:mm')}</span>
                </div>
                <div className='flex items-center text-sm'>
                   <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                   <Select
                      onValueChange={(value) => handleAssignVolunteer(shift.id, value)}
                      defaultValue={shift.volunteerId ?? 'null'}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Asignar voluntario" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="null">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                  <Trash2 className="h-4 w-4" />
                                  <span>Sin asignar</span>
                              </div>
                          </SelectItem>
                          {shiftAssemblyVolunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                {shift.rejectionReason && (
                  <div className="text-xs text-destructive flex items-start gap-2 pt-2 border-t mt-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <RejectionNote shift={shift} />
                      {shift.rejectionReason !== 'Sin motivo' && <p className="mt-1 italic">"{shift.rejectionReason}"</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
  );

  const renderDesktopView = () => (
     <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Posición</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Voluntario Asignado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredShifts.map(shift => {
            const Icon = LucideIcons[shift.position.iconName as keyof typeof LucideIcons] as React.ElementType;
            const shiftAssemblyVolunteers = getVolunteersForShiftAssembly(shift);
            return (
              <TableRow key={shift.id} className={shift.rejectionReason ? 'bg-destructive/10' : ''}>
                <TableCell>{format(shift.startTime, 'dd/MM/yyyy')}</TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                  {shift.position.name}
                </TableCell>
                <TableCell>{format(shift.startTime, 'HH:mm')} - {format(shift.endTime, 'HH:mm')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                      <Select
                        onValueChange={(value) => handleAssignVolunteer(shift.id, value)}
                        defaultValue={shift.volunteerId ?? 'null'}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Asignar voluntario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Trash2 className="h-4 w-4" />
                              <span>Sin asignar</span>
                            </div>
                          </SelectItem>
                          {shiftAssemblyVolunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(shift)}</TableCell>
                <TableCell>
                  <RejectionNote shift={shift} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Gestionar Turnos</CardTitle>
          <CardDescription>Crear y asignar turnos a los voluntarios.</CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select onValueChange={setSelectedAssembly} value={selectedAssembly || ''}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecciona una asamblea" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Asambleas</SelectItem>
              {assemblies.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedAssemblyForCreation}><PlusCircle className="mr-2 h-4 w-4" />Crear Turno</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Turno</DialogTitle>
              </DialogHeader>
              <form action={formAction} ref={formRef} className="space-y-4">
                <input type="hidden" name="assemblyId" value={selectedAssemblyForCreation || ''} />
                <div className="space-y-2">
                    <Label htmlFor="create-shift-assembly">Asamblea</Label>
                    <Select name="assemblyId" required onValueChange={setSelectedAssemblyForCreation} value={selectedAssemblyForCreation || ''}>
                        <SelectTrigger id="create-shift-assembly"><SelectValue placeholder="Selecciona una asamblea" /></SelectTrigger>
                        <SelectContent>
                            {assemblies.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del turno</Label>
                  <Select name="date" required>
                    <SelectTrigger><SelectValue placeholder="Selecciona una fecha" /></SelectTrigger>
                    <SelectContent>
                      {getDaysForAssembly(selectedAssemblyForCreation).map(day => (
                        <SelectItem key={day.toISOString()} value={formatISO(day, { representation: 'date' })}>
                          {format(day, "eeee, d 'de' MMMM", { locale: es })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionId">Posición</Label>
                  <Select name="positionId" required>
                    <SelectTrigger><SelectValue placeholder="Selecciona una posición" /></SelectTrigger>
                    <SelectContent>
                      {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Input id="startTime" name="startTime" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input id="endTime" name="endTime" type="time" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteerId">Asignar a Voluntario (opcional)</Label>
                  <Select name="volunteerId" defaultValue="null">
                    <SelectTrigger><SelectValue placeholder="Selecciona un voluntario" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Sin asignar</SelectItem>
                      {assemblyVolunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <SubmitButton />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredShifts.length > 0 ? (
          isMobile ? renderMobileView() : renderDesktopView()
        ) : (
          <div className="text-center py-16 px-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">No hay turnos creados</h2>
              <p className="text-muted-foreground mt-2">Crea el primer turno para esta asamblea usando el botón de arriba.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
