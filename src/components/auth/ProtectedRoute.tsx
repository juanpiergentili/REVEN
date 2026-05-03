import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { Loader2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'unauthenticated' | 'pending' | 'active' | 'rejected';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setStatus('unauthenticated');
        navigate('/');
        return;
      }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (!snap.exists()) { setStatus('pending'); return; }
      const data = snap.data();
      if (data.role === 'ADMIN') { setStatus('active'); return; }
      setStatus(data.status === 'active' ? 'active' : (data.status ?? 'pending'));
    });
    return unsub;
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'pending') return <PendingScreen />;
  if (status === 'rejected') return <RejectedScreen />;
  if (status === 'unauthenticated') return null;

  return <>{children}</>;
}

function PendingScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <Clock className="h-10 w-10 text-yellow-400" />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">Cuenta en revisión</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">Solicitud pendiente</h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          Tu cuenta está siendo verificada por el equipo de REVEN.<br />
          Te avisaremos por email cuando sea aprobada.
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

function RejectedScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 px-4">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">Acceso denegado</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">Cuenta no aprobada</h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          Tu solicitud no fue aprobada. Contactate con el equipo de REVEN para más información.
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
