'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

import type { Position, PopulatedAssembly } from '@/lib/types';
import { addPosition, updatePosition, deletePosition } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, ParkingCircle, TrafficCone, UserCheck, RadioTower, ClipboardCheck, Car, Key, Shield, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const icons = { ParkingCircle, TrafficCone, UserCheck, RadioTower, ClipboardCheck, Car, Key, Shield };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  const text = isEditing ? 'Guardando...' : 'Añadiendo...';
  const defaultText = isEditing ? 'Guardar Cambios' : 'Añadir Posición';
  return (
    <Button type="submit" disabled={pending}>
      {pending ? text : defaultText}
    </Button>
  );
}

function DeleteSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction type="submit" disabled={pending}>
            {pending ? 'Eliminando...' : 'Eliminar'}
        </AlertDialogAction>
    )
}

function PositionForm({ assemblyId, position, closeDialog }: { assemblyId: string, position?: Position | null, closeDialog: () => void }) {
    const isEditing = !!position;
    const action = isEditing ? updatePosition : addPosition;
    const [state, formAction] = useActionState(action, { success: false, error: null, message: null });
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
            <input type="hidden" name="assemblyId" value={assemblyId} />
            {isEditing && <input type="hidden" name="positionId" value={position.id} />}

            <div className="space-y-2">
                <Label htmlFor="name">Nombre de la posición</Label>
                <Input id="name" name="name" required defaultValue={position?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" required defaultValue={position?.description} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="iconName">Icono</Label>
                <Select name="iconName" required defaultValue={position?.iconName}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un icono" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(icons).map(([name, IconComponent]) => (
                            <SelectItem key={name} value={name}>
                                <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                <SubmitButton isEditing={isEditing} />
            </DialogFooter>
        </form>
    )
}

function DeletePositionForm({ position, assemblyId, closeDialog }: { position: Position, assemblyId: string, closeDialog: () => void }) {
    const [state, formAction] = useActionState(deletePosition, { success: false, error: null, message: null });
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
        <form action={formAction}>
            <input type="hidden" name="positionId" value={position.id} />
            <input type="hidden" name="assemblyId" value={assemblyId} />
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <DeleteSubmitButton />
            </AlertDialogFooter>
        </form>
    )
}


export default function PositionsTab({ initialPositions, assembly }: { initialPositions: Position[], assembly: PopulatedAssembly }) {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setDialogOpen(true);
  }

  const handleAddNew = () => {
    setEditingPosition(null);
    setDialogOpen(true);
  }

  const renderMobileView = () => (
    <div className="space-y-4">
      {initialPositions.map(position => {
        const Icon = LucideIcons[position.iconName as keyof typeof LucideIcons] as React.ElementType;
        return (
          <Card key={position.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-3">
                  {Icon && <Icon className="h-6 w-6 text-primary" />}
                  {position.name}
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(position)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeletingPosition(position)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{position.description}</p>
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
          <TableHead>Icono</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {initialPositions.map(position => {
          const Icon = LucideIcons[position.iconName as keyof typeof LucideIcons] as React.ElementType;
          return (
            <TableRow key={position.id}>
              <TableCell>{Icon && <Icon className="h-5 w-5 text-primary" />}</TableCell>
              <TableCell className="font-medium">{position.name}</TableCell>
              <TableCell>{position.description}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(position)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeletingPosition(position)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestionar Posiciones</CardTitle>
          <CardDescription>Añadir, editar y eliminar posiciones para esta asamblea.</CardDescription>
        </div>
        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" />Añadir Posición</Button>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingPosition(null); setDialogOpen(isOpen); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingPosition ? 'Editar Posición' : 'Nueva Posición'}</DialogTitle>
              </DialogHeader>
              <PositionForm assemblyId={assembly.id} position={editingPosition} closeDialog={() => setDialogOpen(false)} />
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingPosition} onOpenChange={(isOpen) => !isOpen && setDeletingPosition(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará la posición y se desasignarán los voluntarios de los turnos asociados.
                </AlertDialogDescription>
            </AlertDialogHeader>
            {deletingPosition && <DeletePositionForm position={deletingPosition} assemblyId={assembly.id} closeDialog={() => setDeletingPosition(null)} />}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

    