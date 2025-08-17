'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth } from '@/hooks/use-auth';
import { login } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Shield, User } from 'lucide-react';
import { Separator } from '../ui/separator';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      <LogIn className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, null);
  const { login: authLogin } = useAuth();

  useEffect(() => {
    if (state?.success && state.user) {
      authLogin(state.user);
    }
  }, [state, authLogin]);

  const handleQuickLogin = (role: 'admin' | 'volunteer') => {
    let user;
    if (role === 'admin') {
      user = { id: '1', name: 'Admin User', email: 'admin@example.com', phone: '123-456-7890', role: 'admin', passwordHash: 'adminpassword' };
    } else {
      user = { id: '2', name: 'Andrés García', email: 'andres@example.com', phone: '234-567-8901', role: 'volunteer', passwordHash: 'password' };
    }
    authLogin(user);
  };


  return (
    <Card>
      <form action={formAction}>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
            {state?.error?.email && <p className="text-xs text-destructive">{state.error.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
             {state?.error?.password && <p className="text-xs text-destructive">{state.error.password}</p>}
          </div>

          {state?.error?.form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Inicio de Sesión</AlertTitle>
              <AlertDescription>{state.error.form}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6 pt-0">
          <SubmitButton />

            <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">O</span>
            </div>

            <p className="text-sm text-center text-muted-foreground">Usa un acceso rápido para probar:</p>
            <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="outline" onClick={() => handleQuickLogin('admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                </Button>
                 <Button variant="outline" onClick={() => handleQuickLogin('volunteer')}>
                    <User className="mr-2 h-4 w-4" />
                    Voluntario
                </Button>
            </div>
        </CardFooter>
      </form>
    </Card>
  );
}
