import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, XCircle, CheckCircle2, MonitorX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { getSessionId, pingSession, clearSessionId } from '@/src/lib/sessions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

type Status = 'loading' | 'unauthenticated' | 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';

export function ProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [sessionKicked, setSessionKicked] = useState(false);
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
        setAccountDeleted(false);
      } else {
        // No Firestore document — account was deleted or never created
        setAccountDeleted(true);
      }
      setProfileLoading(false);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    const SUPER_ADMINS_LIST = ['lucas.ferreyra@gmail.com'];
    const isAdminUser = profile.role === 'ADMIN' || (user.email && SUPER_ADMINS_LIST.includes(user.email));
    if (isAdminUser || profile.status !== 'active') return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) {
        clearSessionId();
        setSessionKicked(true);
      }
    });

    const heartbeat = setInterval(() => {
      pingSession(user.uid);
    }, 3 * 60 * 1000);

    return () => {
      unsub();
      clearInterval(heartbeat);
    };
  }, [user, profile]);

  if (sessionKicked) {
    return <SessionKickedScreen />;
  }

  if (accountDeleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6 px-4 bg-background">
        <XCircle className="h-16 w-16 text-red-400" />
        <div className="space-y-2 max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">Cuenta eliminada</p>
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Tu cuenta fue desactivada</h1>
          <p className="text-muted-foreground text-sm">Contactate con el equipo REVEN para más información.</p>
        </div>
        <Button variant="outline" onClick={() => signOut(auth)} className="rounded-2xl h-12 font-bold uppercase tracking-widest text-xs">
          Cerrar Sesión
        </Button>
      </div>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verificando Credenciales...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const SUPER_ADMINS = ['lucas.ferreyra@gmail.com'];
  const isSuperAdmin = user?.email && SUPER_ADMINS.includes(user.email);
  const status = (profile?.role === 'ADMIN' || isSuperAdmin) ? 'active' : (profile?.status || 'pending');

  const trialEndDate = profile?.trialEndDate?.toDate?.();
  const trialExpired = trialEndDate ? new Date() > trialEndDate : false;

  // Grace period: user cancelled but has paid through scheduledCancelDate
  const scheduledCancelDate = profile?.scheduledCancelDate?.toDate?.();
  const inGracePeriod = scheduledCancelDate ? new Date() < scheduledCancelDate : false;

  if (requireApproval && status === 'pending') {
    return <PendingScreen />;
  }

  if (requireApproval && status === 'approved') {
    if (location.pathname !== '/payment') {
      return <Navigate to="/payment" replace />;
    }
    return <>{children}</>;
  }

  if (requireApproval && status === 'rejected') {
    return <RejectedScreen />;
  }

  // Suspended user — allow access during grace period (paid until scheduledCancelDate)
  if (requireApproval && status === 'suspended') {
    if (inGracePeriod) {
      return <>{children}</>;
    }
    if (location.pathname !== '/payment') {
      return <Navigate to="/payment" replace />;
    }
    return <>{children}</>;
  }

  // Active user with expired trial and no real subscription → redirect to payment
  const hasRealSubscription = !!profile?.subscriptionId && profile?.subscriptionStatus === 'authorized';
  if (requireApproval && status === 'active' && trialExpired && !hasRealSubscription && !isSuperAdmin && profile?.role !== 'ADMIN') {
    if (location.pathname !== '/payment') {
      return <Navigate to="/payment" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}

type StepState = 'done' | 'active' | 'pending';

function FlowStep({ number, label, state }: { number: string; label: string; state: StepState }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      state === 'done'    ? 'border-primary/30 bg-primary/5' :
      state === 'active'  ? 'border-yellow-500/30 bg-yellow-500/5' :
                            'border-border bg-background/30'
    }`}>
      <span className={`text-[10px] font-black tracking-widest shrink-0 ${
        state === 'done'   ? 'text-primary' :
        state === 'active' ? 'text-yellow-400' :
                             'text-muted-foreground'
      }`}>{number}</span>

      <span className={`text-xs font-bold uppercase tracking-widest flex-1 ${
        state === 'pending' ? 'text-muted-foreground' : 'text-white'
      }`}>{label}</span>

      {state === 'done' && (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      )}
      {state === 'active' && (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
        </span>
      )}
    </div>
  );
}

function PendingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4 bg-background">
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">Cuenta en revisión</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">Solicitud pendiente</h1>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
          Tu solicitud está siendo revisada por el equipo REVEN.<br />
          Te avisaremos por email cuando sea aprobada.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <FlowStep number="01" label="Solicitud recibida" state="done" />
        <FlowStep number="02" label="Verificación en curso" state="active" />
        <FlowStep number="03" label="Acceso habilitado" state="pending" />
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

function SessionKickedScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4 bg-background">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <MonitorX className="h-10 w-10 text-yellow-400" />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">Sesión cerrada</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">Límite de sesiones</h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          Se inició sesión desde otro dispositivo y se alcanzó el límite de tu plan.<br />
          Volvé a ingresar para continuar.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => signOut(auth).then(() => { window.location.href = '/'; })}
        className="rounded-full px-10 h-12 font-bold uppercase tracking-widest text-xs border-border"
      >
        Volver al inicio
      </Button>
    </div>
  );
}
