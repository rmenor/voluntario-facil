'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useRef } from 'react';

import type { User, PopulatedAssembly } from '@/lib/types';
import { updateAssembly } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function EditSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

function AddVolunteersForm({ assembly, allUsers, closeDialog }: { assembly: PopulatedAssembly, allUsers: User[], closeDialog: () => void }) {
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
            <input type="hidden" name="title" value={assembly.title} />
            <input type="hidden" name="startDate" value={new Date(assembly.startDate).toISOString()} />
            <input type="hidden" name="endDate" value={new Date(assembly.endDate).toISOString()} />
            <input type="hidden" name="type" value={assembly.type} />
            <div className="space-y-2">
                <Label>Voluntarios</Label>
                <ScrollArea className="h-60 rounded-md border p-4">
                <div className="space-y-2">
                    {allUsers.filter(u => u.role === 'volunteer').map(volunteer => (
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


const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`;
  }
  return name.substring(0, 2);
};

export default function VolunteersTab({ assembly, initialVolunteers, allUsers }: { assembly: PopulatedAssembly, initialVolunteers: User[], allUsers: User[] }) {
  const [isAddOpen, setAddOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const renderMobileView = () => (
    <div className="space-y-4">
      {initialVolunteers.map(user => (
        <Card key={user.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex items-center">
                <span>{user.email}</span>
            </div>
             <div className="flex items-center">
                <span>{user.phone}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {initialVolunteers.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                {user.name}
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );


  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Voluntarios de la Asamblea</CardTitle>
          <CardDescription>Añadir y gestionar los voluntarios asignados a esta asamblea.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
                <Button className='w-full sm:w-auto'><PlusCircle className="mr-2 h-4 w-4" />Añadir/Quitar</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Asignar Voluntarios</DialogTitle>
                </DialogHeader>
                <AddVolunteersForm assembly={assembly} allUsers={allUsers} closeDialog={() => setAddOpen(false)} />
            </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
}

    