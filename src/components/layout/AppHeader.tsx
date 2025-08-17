'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Handshake, LogOut, UserCircle, Edit, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { useFormStatus } from 'react-dom';
import { updateProfile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            authLogin(state.user, true);
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

export default function AppHeader() {
  const { user, logout } = useAuth();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
            <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'} className="mr-6 flex items-center space-x-2">
                <Handshake className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline sm:inline-block">
                Voluntariado Fácil
                </span>
            </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
             <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/chat">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">Chat</span>
                </Link>
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DialogTrigger asChild>
                      <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar Perfil</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Editar mi perfil</DialogTitle>
                  </DialogHeader>
                  <EditProfileForm user={user} closeDialog={() => setEditDialogOpen(false)} />
              </DialogContent>
             </Dialog>
        </div>
      </div>
    </header>
  );
}
