import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, db, app } from '@/src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Logo } from '@/src/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { motion } from 'framer-motion';
import { PLAN_LIMITS, normalizePlan } from '@/src/types';

import type { MembershipPlan } from '@/src/types';

function PlanFeatures({ plan }: { plan: MembershipPlan }) {
  const limits = PLAN_LIMITS[plan];
  const pub = limits.maxVehicles === Infinity ? 'Publicaciones ilimitadas' : `Hasta ${limits.maxVehicles} publicaciones activas`;
  const bus = limits.maxWantedSearches === Infinity ? 'Búsquedas activas ilimitadas' : `Hasta ${limits.maxWantedSearches} búsquedas activas`;
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />{pub}</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />{bus}</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />Métricas de tu agencia</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />Acceso completo al marketplace REVEN</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />Directorio de agencias verificadas</li>
    </ul>
  );
}

const PLAN_LABEL: Record<string, string> = {
  business:     'Plan Business',
  professional: 'Plan Profesional',
  profesional:  'Plan Profesional',
  enterprise:   'Plan Enterprise',
  platinum:     'Plan Enterprise',
};

const PLAN_PRICE: Record<string, { monthly: number; annual: number }> = {
  business:     { monthly: 200000, annual: 1800000 },
  professional: { monthly: 350000, annual: 3150000 },
  profesional:  { monthly: 350000, annual: 3150000 },
  enterprise:   { monthly: 500000, annual: 4500000 },
  platinum:     { monthly: 500000, annual: 4500000 },
};

type StepState = 'done' | 'active' | 'pending';

function FlowStep({ number, label, state }: { number: string; label: string; state: StepState }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      state === 'done'   ? 'border-primary/30 bg-primary/5' :
      state === 'active' ? 'border-primary/50 bg-primary/10' :
                           'border-border bg-background/30'
    }`}>
      <span className={`text-[10px] font-black tracking-widest shrink-0 ${
        state === 'pending' ? 'text-muted-foreground' : 'text-primary'
      }`}>{number}</span>
      <span className={`text-xs font-bold uppercase tracking-widest flex-1 ${
        state === 'pending' ? 'text-muted-foreground' : 'text-white'
      }`}>{label}</span>
      {state === 'done' && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
      {state === 'active' && (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
      )}
    </div>
  );
}

export function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const fromMP = fromParam === 'mp' || fromParam === 'trial';
  const fromUpgrade = fromParam === 'upgrade';

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const celebratingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);

        const trialEnd = data.trialEndDate?.toDate?.();
        const trialExpired = trialEnd ? new Date() > trialEnd : false;

        // Upgrade "now" confirmed: pendingUpgradeNow cleared and upgradeMode set
        if (fromUpgrade && data.upgradeMode === 'now' && !data.pendingUpgradeNow) {
          navigate('/profile', { replace: true });
          return;
        }

        if (data.status === 'active' && !trialExpired && !celebratingRef.current) {
          celebratingRef.current = true;
          setCelebrating(true);
          setTimeout(() => navigate('/marketplace', { replace: true }), 3000);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user, navigate, fromUpgrade]);

  async function handlePay() {
    if (!user) return;
    setPaying(true);
    setError('');
    try {
      const functions = getFunctions(app, 'us-central1');
      const createSubscription = httpsCallable(functions, 'createSubscription');
      const result: any = await createSubscription({});
      window.location.href = result.data.init_point;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el pago. Intentá de nuevo.');
      setPaying(false);
    }
  }

  async function handleActivateTrial() {
    if (!user) return;
    setPaying(true);
    setError('');
    try {
      const functions = getFunctions(app, 'us-central1');
      const activateTrial = httpsCallable(functions, 'activateTrial');
      await activateTrial({});
      // Firestore onSnapshot listener detects status:'active' → celebration → navigate to marketplace
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.includes('ya fue utilizado') || msg.includes('already-exists') || msg.includes('ya fue activado')) {
        setError('Este código ya fue utilizado. No podés activar el período de prueba nuevamente.');
      } else {
        setError(msg || 'Error al activar el período de prueba. Intentá de nuevo.');
      }
      setPaying(false);
    }
  }

  // Celebration overlay
  if (celebrating) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8 px-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.4 }}
            >
              <CheckCircle2 className="h-16 w-16 text-black" strokeWidth={2.5} />
            </motion.div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatDelay: 0.6 }}
            className="absolute inset-0 rounded-full border-2 border-primary"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.6, repeat: Infinity, repeatDelay: 0.3 }}
            className="absolute inset-0 rounded-full border border-primary/50"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center space-y-3"
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            ¡Bienvenido a REVEN!
          </h1>
          <p className="text-primary font-bold uppercase tracking-widest text-xs">
            {profile?.discountCode === 'REVENFREE60' ? 'Período de prueba activado · 60 días' : 'Suscripción activada'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Accediendo al marketplace...
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = profile?.plan || 'business';
  const cycle = profile?.billingCycle || 'monthly';
  const price = PLAN_PRICE[plan]?.[cycle as 'monthly' | 'annual'] ?? 200000;
  const isFreeCode = profile?.discountCode === 'REVENFREE60';
  const trialEnd = profile?.trialEndDate?.toDate?.();
  const trialExpired = trialEnd ? new Date() > trialEnd : false;
  const isApproved = profile?.status === 'approved';
  const isActive = profile?.status === 'active';
  const isSuspended = profile?.status === 'suspended';

  const isCancelled = profile?.subscriptionStatus === 'cancelled' || profile?.subscriptionStatus === 'pending_cancel';

  // Suspended: payment was rejected or subscription cancelled
  if (isSuspended && !fromMP) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center mb-2">
            <Logo className="text-4xl" variant="dark" />
          </div>
          <div className="text-center space-y-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isCancelled ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
              <XCircle className={`h-7 w-7 ${isCancelled ? 'text-yellow-400' : 'text-red-400'}`} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isCancelled ? 'text-yellow-400' : 'text-red-400'}`}>
              {isCancelled ? 'Suscripción cancelada' : 'Acceso suspendido'}
            </p>
            <h1 className="text-3xl font-bold uppercase tracking-tighter leading-none">
              {isCancelled ? 'Tu suscripción venció' : 'Tu pago fue rechazado'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isCancelled
                ? 'Tu período de acceso finalizó. Suscribite nuevamente para seguir usando REVEN.'
                : <>No pudimos procesar tu último pago.<br />Renová tu suscripción para recuperar el acceso.</>}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wide text-sm">{PLAN_LABEL[plan] || plan}</span>
              <span className="text-xs text-muted-foreground uppercase">{cycle === 'annual' ? 'Anual' : 'Mensual'}</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black">${price.toLocaleString('es-AR')}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {cycle === 'annual' ? 'año' : 'mes'}</span>
            </div>
            <PlanFeatures plan={normalizePlan(plan)} />
          </div>

          {error && <p className="text-red-400 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}

          <div className="space-y-3">
            <Button
              className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs bg-primary text-black hover:bg-primary/90"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirigiendo...</> : 'Renovar suscripción'}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 rounded-2xl font-bold uppercase tracking-widest text-xs text-muted-foreground"
              onClick={() => signOut(auth)}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Returned from MP checkout — waiting for webhook
  if (fromMP) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center">
            <Logo className="text-4xl" variant="dark" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verificando pago</p>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">Procesando tu suscripción...</h1>
            <p className="text-muted-foreground text-xs">Esto puede tardar unos segundos. No cierres esta pestaña.</p>
          </div>
          <div className="space-y-2">
            <FlowStep number="01" label="Solicitud recibida" state="done" />
            <FlowStep number="02" label="Admisión verificada" state="done" />
            <FlowStep number="03" label="Activando suscripción" state="active" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="font-bold uppercase tracking-widest">Esperando confirmación de Mercado Pago</span>
          </div>
        </div>
      </div>
    );
  }

  // Returned from MP after paying upgrade difference — waiting for payment webhook
  if (fromUpgrade) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center">
            <Logo className="text-4xl" variant="dark" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verificando pago</p>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">Procesando tu upgrade...</h1>
            <p className="text-muted-foreground text-xs">Esto puede tardar unos segundos. No cierres esta pestaña.</p>
          </div>
          <div className="space-y-2">
            <FlowStep number="01" label="Pago recibido" state="done" />
            <FlowStep number="02" label="Actualizando plan" state="active" />
            <FlowStep number="03" label="Límites habilitados" state="pending" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="font-bold uppercase tracking-widest">Esperando confirmación de Mercado Pago</span>
          </div>
        </div>
      </div>
    );
  }

  // Trial expired — needs to subscribe now
  if (isActive && trialExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Logo className="text-4xl" variant="dark" />
          </div>
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
              <Clock className="h-7 w-7 text-yellow-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Período de prueba vencido</p>
            <h1 className="text-3xl font-bold uppercase tracking-tighter leading-none">Activá tu suscripción</h1>
            <p className="text-muted-foreground text-sm">
              Tu período gratuito de 60 días ha finalizado.<br />
              Suscribite para seguir operando en REVEN.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wide text-sm">{PLAN_LABEL[plan] || plan}</span>
              <span className="text-xs text-muted-foreground uppercase">{cycle === 'annual' ? 'Anual' : 'Mensual'}</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black">${price.toLocaleString('es-AR')}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {cycle === 'annual' ? 'año' : 'mes'}</span>
            </div>
            <PlanFeatures plan={normalizePlan(plan)} />
          </div>

          {error && <p className="text-red-400 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}

          <div className="space-y-3">
            <Button
              className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs bg-primary text-black hover:bg-primary/90"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirigiendo...</> : 'Suscribirme con Mercado Pago'}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 rounded-2xl font-bold uppercase tracking-widest text-xs text-muted-foreground"
              onClick={() => signOut(auth)}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Approved + REVENFREE60 — free activation (monthly only)
  if (isApproved && isFreeCode) {
    const isAnnualWithFreeCode = cycle === 'annual';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">

          <div className="flex justify-center">
            <Logo className="text-4xl" variant="dark" />
          </div>

          <div className="space-y-2">
            <FlowStep number="01" label="Solicitud recibida" state="done" />
            <FlowStep number="02" label="Admisión verificada" state="done" />
            <FlowStep number="03" label="Activar acceso gratuito" state={isAnnualWithFreeCode ? 'pending' : 'active'} />
          </div>

          {isAnnualWithFreeCode ? (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-2 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Código no válido para plan anual</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El código <span className="text-white font-bold">REVENFREE60</span> solo aplica a planes mensuales. Tu plan está configurado como <span className="text-white font-bold">anual</span>. Contactá a REVEN para cambiarlo a mensual.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Admisión aprobada</p>
                <h1 className="text-3xl font-bold uppercase tracking-tighter leading-none">60 días sin cargo</h1>
                <p className="text-muted-foreground text-sm">
                  Tu código <span className="text-white font-bold">REVENFREE60</span> activa 60 días de acceso completo a REVEN sin costo.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wide text-sm">{PLAN_LABEL[plan] || plan}</span>
                  <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-full">60 días gratis</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-primary">$0</span>
                  <span className="text-muted-foreground text-sm mb-1">hoy</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Luego de los 60 días se facturará ${price.toLocaleString('es-AR')} / mes
                </p>
              </div>

              {error && <p className="text-red-400 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}

              <Button
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs bg-primary text-black hover:bg-primary/90"
                onClick={handleActivateTrial}
                disabled={paying}
              >
                {paying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Activando...</> : 'Activar acceso gratuito'}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full h-10 rounded-2xl font-bold uppercase tracking-widest text-xs text-muted-foreground"
            onClick={() => signOut(auth)}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // Approved + normal plan — pay with MP
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        <div className="flex justify-center">
          <Logo className="text-4xl" variant="dark" />
        </div>

        <div className="space-y-2">
          <FlowStep number="01" label="Solicitud recibida" state="done" />
          <FlowStep number="02" label="Admisión verificada" state="done" />
          <FlowStep number="03" label="Activar suscripción" state="active" />
        </div>

        <div className="text-center space-y-1 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Admisión aprobada</p>
          <h1 className="text-3xl font-bold uppercase tracking-tighter leading-none">Completá tu suscripción</h1>
          <p className="text-muted-foreground text-sm">Activá tu plan para acceder a la plataforma.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wide text-sm">{PLAN_LABEL[plan] || plan}</span>
            <span className="text-xs text-muted-foreground uppercase">{cycle === 'annual' ? 'Anual' : 'Mensual'}</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black">${price.toLocaleString('es-AR')}</span>
            <span className="text-muted-foreground text-sm mb-1">/ {cycle === 'annual' ? 'año' : 'mes'}</span>
          </div>
          <PlanFeatures plan={normalizePlan(plan)} />
        </div>

        {error && <p className="text-red-400 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}

        <div className="space-y-3">
          <Button
            className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs bg-primary text-black hover:bg-primary/90"
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirigiendo...</> : 'Pagar con Mercado Pago'}
          </Button>
          <Button
            variant="ghost"
            className="w-full h-10 rounded-2xl font-bold uppercase tracking-widest text-xs text-muted-foreground"
            onClick={() => signOut(auth)}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
