'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useRef, useMemo } from 'react';

import type { User } from '@/lib/types';
import { addVolunteer, updateVolunteer } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Mail, Phone, Search, User as UserIcon, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

function AddSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Añadiendo...' : 'Añadir Voluntario'}
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

function EditVolunteerForm({ user, closeDialog }: { user: User, closeDialog: () => void}) {
    const [state, formAction] = useActionState(updateVolunteer, { success: false, error: null, message: null });
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
            <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select name="role" defaultValue={user.role}>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="volunteer">Voluntario</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
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

export default function VolunteersTab({ initialUsers }: { initialUsers: User[] }) {
  const [addState, addFormAction] = useActionState(addVolunteer, { success: false, error: null, message: null });
  const { toast } = useToast();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'volunteer'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return initialUsers.filter(user => {
      const byRole = roleFilter === 'all' || user.role === roleFilter;
      
      const bySearch = searchTerm === '' ||
        user.name.toLowerCase().includes(lowercasedFilter) ||
        user.email.toLowerCase().includes(lowercasedFilter) ||
        user.phone.toLowerCase().includes(lowercasedFilter);

      return byRole && bySearch;
    });
  }, [initialUsers, roleFilter, searchTerm]);

  useEffect(() => {
    if (addState.success) {
      toast({ title: 'Éxito', description: addState.message });
      setCreateOpen(false);
      createFormRef.current?.reset();
    } else if (addState.error) {
      toast({ variant: 'destructive', title: 'Error', description: addState.error });
    }
  }, [addState, toast]);

  const renderMobileView = () => (
    <div className="space-y-4">
      {filteredUsers.map(user => (
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
                  <CardDescription>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                  </CardDescription>
                </div>
              </div>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingUser(user)}>
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${user.email}`} className="text-primary hover:underline">{user.email}</a>
            </div>
             <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
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
          <TableHead>Rol</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map(user => (
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
            <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                    <Edit className="h-4 w-4" />
                </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );


  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Gestionar Voluntarios</CardTitle>
          <CardDescription>Añadir y ver información de los voluntarios.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8 sm:w-[200px] md:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select onValueChange={(value) => setRoleFilter(value as any)} value={roleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="volunteer">Voluntario</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
                <Button className='w-full sm:w-auto'><PlusCircle className="mr-2 h-4 w-4" />Añadir Voluntario</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Nuevo Voluntario</DialogTitle>
                </DialogHeader>
                <form action={addFormAction} ref={createFormRef} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select name="role" defaultValue="volunteer">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="volunteer">Voluntario</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <AddSubmitButton />
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>

      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Voluntario</DialogTitle>
            </DialogHeader>
            {editingUser && <EditVolunteerForm user={editingUser} closeDialog={() => setEditingUser(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
