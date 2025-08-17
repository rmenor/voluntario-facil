import { Handshake } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary/20 p-3 text-primary">
            <Handshake className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-center text-foreground">
            Voluntariado Fácil
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Bienvenido de nuevo. Por favor, inicia sesión.
          </p>
        </div>
        
        <LoginForm />

      </div>
       <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Voluntariado Fácil. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
