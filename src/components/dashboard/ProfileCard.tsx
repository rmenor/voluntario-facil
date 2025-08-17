'use client';

import { useEffect, useState, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Edit } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

function EditProfileForm({ user, closeDialog }: { user: User, closeDialog: () => void }) {
    const [state, formAction] = useActionState(updateProfile, { success: false, error: null, message: null, user: null });
    const { toast } = useToast();
    const { login: authLogin } = useAuth();
    
    useEffect(() => {
        if (state.success && state.user) {
            toast({ title: 'Éxito', description: state.message });
            authLogin(state.user, true); // Pass true for isUpdate
            closeDialog();
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, closeDialog, authLogin]);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" name="name" required defaultValue={user.name}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required defaultValue={user.email} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" required defaultValue={user.phone} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
    )
}

export default function ProfileCard({ user }: { user: User }) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
        <CardDescription>Tu información de contacto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm">
          <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center text-sm">
          <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
          <span>{user.phone}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4"/> Editar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar mi perfil</DialogTitle>
                </DialogHeader>
                <EditProfileForm user={user} closeDialog={() => setEditDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
