import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, ShieldAlert, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

type Status = 'loading' | 'unauthenticated' | 'pending' | 'active' | 'rejected';

export function ProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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

  const status = profile?.role === 'ADMIN' ? 'active' : (profile?.status || 'pending');

  if (requireApproval && status === 'pending') {
    return <PendingScreen />;
  }

  if (requireApproval && status === 'rejected') {
    return <RejectedScreen />;
  }

  return <>{children}</>;
}

function PendingScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4 bg-background">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <Clock className="h-10 w-10 text-yellow-400" />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">Cuenta en revisión</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">Solicitud pendiente</h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          Tu cuenta está siendo verificada por el equipo comercial de REVEN.<br />
          Te avisaremos por email cuando sea aprobada.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="rounded-2xl h-12 font-bold uppercase tracking-widest text-xs border-border"
        >
          Verificar Estado
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut(auth)}
          className="rounded-2xl h-12 font-bold uppercase tracking-widest text-xs text-muted-foreground"
        >
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

function RejectedScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4 bg-background">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">Acceso denegado</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">Cuenta no aprobada</h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          Tu solicitud no fue aprobada por nuestro equipo comercial.<br />
          Contactate con REVEN para más información.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="rounded-full px-10 h-12 font-bold uppercase tracking-widest text-xs border-border"
      >
        Volver al inicio
      </Button>
    </div>
  );
}
