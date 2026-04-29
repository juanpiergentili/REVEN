import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

export function ProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setProfileLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verificando Credenciales...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireApproval && profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card/50 backdrop-blur-3xl border border-border/50 p-10 rounded-[3rem] text-center space-y-6 shadow-2xl">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Acceso Pendiente</h2>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Tu solicitud de admisión está siendo revisada por nuestro equipo comercial. 
              Te notificaremos por email una vez que tu cuenta sea aprobada.
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <Button 
              variant="outline" 
              className="w-full rounded-2xl h-14 font-bold uppercase tracking-widest text-xs"
              onClick={() => window.location.reload()}
            >
              Verificar Estado
            </Button>
            <Button 
              variant="ghost" 
              className="w-full rounded-2xl h-14 font-bold uppercase tracking-widest text-xs text-muted-foreground"
              onClick={() => signOut(auth)}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireApproval && profile?.status === 'rejected') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
