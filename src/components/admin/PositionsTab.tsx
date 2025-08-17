'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

import type { Position } from '@/lib/types';
import { addPosition } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, ParkingCircle, TrafficCone, UserCheck, RadioTower, ClipboardCheck, Car, Key, Shield } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

const icons = { ParkingCircle, TrafficCone, UserCheck, RadioTower, ClipboardCheck, Car, Key, Shield };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Añadiendo...' : 'Añadir Posición'}
    </Button>
  );
}

export default function PositionsTab({ initialPositions }: { initialPositions: Position[] }) {
  const [state, formAction] = useActionState(addPosition, { success: false, error: null, message: null });
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Éxito', description: state.message });
      setOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast]);

  const renderMobileView = () => (
    <div className="space-y-4">
      {initialPositions.map(position => {
        const Icon = LucideIcons[position.iconName as keyof typeof LucideIcons] as React.ElementType;
        return (
          <Card key={position.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {Icon && <Icon className="h-6 w-6 text-primary" />}
                {position.name}
              </CardTitle>
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
          <CardDescription>Añadir y ver las posiciones de los voluntarios.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" />Añadir Posición</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Posición</DialogTitle>
            </DialogHeader>
            <form action={formAction} ref={formRef} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la posición</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iconName">Icono</Label>
                <Select name="iconName" required>
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
                <SubmitButton />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
}
