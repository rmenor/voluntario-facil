'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PopulatedAssembly, User } from '@/lib/types';
import { addAssembly, updateAssembly } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Users, Calendar, Pencil, Globe, Map } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creando...' : 'Crear Asamblea'}
    </Button>
  );
}

function EditSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
};

function EditAssemblyForm({ assembly, volunteers, closeDialog }: { assembly: PopulatedAssembly, volunteers: User[], closeDialog: () => void }) {
    const [state, formAction] = useActionState(updateAssembly, { success: false, error: null, message: null });
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            toast({ title: 'Éxito', description: state.message });
            closeDialog();
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, closeDialog]);

    return (
        <form action={formAction} ref={formRef} className="space-y-4">
            <input type="hidden" name="assemblyId" value={assembly.id} />
            <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required defaultValue={assembly.title} />
            </div>
             <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup name="type" defaultValue={assembly.type} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regional" id="type-regional-edit" />
                  <Label htmlFor="type-regional-edit" className="font-normal">Regional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="circuito" id="type-circuito-edit" />
                  <Label htmlFor="type-circuito-edit" className="font-normal">Circuito</Label>
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

            <div className="space-y-2">
              <Label>Voluntarios</Label>
              <ScrollArea className="h-40 rounded-md border p-4">
                <div className="space-y-2">
                  {volunteers.map(volunteer => (
                    <div key={volunteer.id} className="flex items-center space-x-2">
                       <Checkbox 
                        id={`volunteer-${volunteer.id}`} 
                        name="volunteerIds"
                        value={volunteer.id}
                        defaultChecked={assembly.volunteerIds.includes(volunteer.id)}
                      />
                      <Label htmlFor={`volunteer-${volunteer.id}`} className="font-normal">{volunteer.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <EditSubmitButton />
            </DialogFooter>
        </form>
    )
}

export default function AssembliesTab({ initialAssemblies, volunteers }: { initialAssemblies: PopulatedAssembly[], volunteers: User[] }) {
  const [addState, addFormAction] = useActionState(addAssembly, { success: false, error: null, message: null });
  const { toast } = useToast();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<PopulatedAssembly | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      toast({ title: 'Éxito', description: addState.message });
      setCreateOpen(false);
      createFormRef.current?.reset();
    } else if (addState.error) {
      toast({ variant: 'destructive', title: 'Error', description: addState.error });
    }
  }, [addState, toast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Gestionar Asambleas</CardTitle>
            <CardDescription>Crear y ver las próximas asambleas.</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Crear Asamblea</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva Asamblea</DialogTitle>
                </DialogHeader>
                <form action={addFormAction} ref={createFormRef} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" name="title" required />
                    </div>
                     <div className="space-y-2">
                      <Label>Tipo</Label>
                      <RadioGroup name="type" defaultValue="regional" className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="regional" id="type-regional" />
                          <Label htmlFor="type-regional" className="font-normal">Regional</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="circuito" id="type-circuito" />
                          <Label htmlFor="type-circuito" className="font-normal">Circuito</Label>
                        </div>
                      </RadioGroup>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha de Inicio</Label>
                            <Input id="startDate" name="startDate" type="date" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="endDate">Fecha de Fin</Label>
                            <Input id="endDate" name="endDate" type="date" required />
                        </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                      <CreateSubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {initialAssemblies.map(assembly => (
                <Card key={assembly.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>{assembly.title}</CardTitle>
                             <Badge variant={assembly.type === 'regional' ? 'default' : 'secondary'} className="capitalize">
                                {assembly.type === 'regional' ? <Globe className="mr-1 h-3 w-3" /> : <Map className="mr-1 h-3 w-3" />}
                                {assembly.type}
                            </Badge>
                        </div>
                        <CardDescription>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(assembly.startDate, "d MMM", {locale: es})} - {format(assembly.endDate, "d MMM, yyyy", {locale: es})}</span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{assembly.volunteers.length} voluntario(s)</span>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mt-2">
                            {assembly.volunteers.slice(0,5).map(v => (
                                <Avatar key={v.id} className="h-8 w-8 border-2 border-card">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${v.name}`} alt={v.name} />
                                    <AvatarFallback>{getInitials(v.name)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {assembly.volunteers.length > 5 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Avatar className="h-8 w-8 border-2 border-card">
                                            <AvatarFallback>+{assembly.volunteers.length - 5}</AvatarFallback>
                                        </Avatar>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                        <div className="flex flex-col gap-1">
                                        {assembly.volunteers.slice(5).map(v => (
                                            <Badge variant="outline" key={v.id}>{v.name}</Badge>
                                        ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                         </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingAssembly(assembly)}>
                            <Pencil className="mr-2 h-3 w-3" /> Editar
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </CardContent>

      <Dialog open={!!editingAssembly} onOpenChange={(isOpen) => !isOpen && setEditingAssembly(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Asamblea</DialogTitle>
            </DialogHeader>
            {editingAssembly && <EditAssemblyForm assembly={editingAssembly} volunteers={volunteers} closeDialog={() => setEditingAssembly(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
