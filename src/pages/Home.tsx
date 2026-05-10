import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Check, ArrowRight, ShieldCheck, FileText, Loader2,
  Users, Shield, CreditCard, Plus, MapPin, Loader, Instagram, Upload, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/layout/Logo';
import { Footer } from '../components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { storage } from '@/src/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscribeToVehicles } from '@/src/lib/vehicles';
import { Vehicle } from '@/src/types';
import { useGeoRef } from '@/src/hooks/useGeoRef';

const SOLUTIONS_LEFT = [
  { icon: Zap, title: 'COMUNICACIÓN DIRECTA', desc: 'Chau grupos ruidosos. Chat interno directo con vendedores reales y stock activo.' },
  { icon: CreditCard, title: 'OPTIMIZACIÓN DE TIEMPO', desc: 'Precios B2B y disponibilidad de stock actualizados en tiempo real al instante.' },
  { icon: Shield, title: 'RED VERIFICADA', desc: 'Operá seguro. Cada concesionaria de REVEN fue validada estrictamente para tu tranquilidad.' },
];

const SOLUTIONS_RIGHT = [
  { icon: Users, title: 'PRECIOS TRANSPARENTES', desc: 'Conocé los valores reales a los que está operando el mercado mayorista en este momento.' },
  { icon: Zap, title: 'LIQUIDEZ INMEDIATA', desc: 'Movilizá tu stock rápido y conectá con cientos de compradores profesionales.' },
  { icon: FileText, title: 'ENTORNO PROFESIONAL', desc: 'Cerrá tratos B2B serios y con respaldo dentro de la plataforma líder en Argentina.' },
];

const STEPS = [
  { number: '01', title: 'Solicitá Admisión', desc: 'Completá el formulario con tus datos profesionales y de tu concesionaria.' },
  { number: '02', title: 'Verificación', desc: 'Auditamos tu perfil para asegurar que sos un profesional real del sector.' },
  { number: '03', title: 'Operá con Reven', desc: 'Ya podés publicar, comprar y permutar con la red privada más grande de Argentina.' },
];

const FAQ_ITEMS = [
  { q: '¿Por qué REVEN no es gratis?', a: 'Porque la exclusividad tiene un costo. El filtro de pago garantiza que todos los miembros son profesionales serios.' },
  { q: '¿Puedo probar antes de pagar?', a: 'Sí. Usá el código REVENFREE60 al registrarte para obtener 60 días de acceso gratuito sin compromisos.' },
  { q: '¿Hay permanencia mínima?', a: 'No. Podés cancelar cuando quieras sin penalidades. Tu acceso se mantiene activo hasta el fin del período facturado.' },
  { q: '¿Qué pasa si mi competencia directa está en REVEN?', a: 'El mercado B2B es colaborativo. Las mejores agencias operan con todas las fuentes disponibles. Tu ventaja está en la velocidad y el acceso a precios reales.' },
  { q: '¿Quién puede ver mis precios?', a: 'Solo miembros verificados de la red. Tus precios B2B son estrictamente confidenciales para el público general.' },
  { q: '¿Cómo cargo mi stock?', a: 'Desde tu perfil de agencia podés publicar unidades con fotos, descripción, precio y condición. El proceso tarda menos de 3 minutos por unidad.' },
  { q: '¿Puedo usar REVEN si ya uso otro sistema de gestión?', a: 'Sí. REVEN funciona como canal de venta adicional, complementario a cualquier sistema de gestión que ya uses.' },
];

const PLAN_PRICES = {
  plata: { monthly: 200000, annual: 1920000 },
  oro: { monthly: 350000, annual: 3360000 },
  platinum: { monthly: 500000, annual: 4800000 },
};

function formatARS(amount: number) {
  return `A$ ${amount.toLocaleString('es-AR')}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function HomeCarCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-[#111] border border-white/5 flex flex-col group hover:border-primary/30 transition-all duration-300">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {vehicle.photos?.[0] ? (
          <img
            src={vehicle.photos[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Sin foto</div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
            {vehicle.condition === '0KM' ? '0 KM' : 'USADO'}
          </span>
        </div>
        {/* Car name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h4 className="text-white font-black tracking-tighter uppercase text-xl leading-none">
            {vehicle.brand} {vehicle.model}
          </h4>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">{vehicle.version}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Concesionaria */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-primary text-[10px] font-black">{getInitials(vehicle.sellerCompany || vehicle.sellerName)}</span>
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-tight leading-none">{vehicle.sellerCompany || vehicle.sellerName}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">Miembro REVEN</p>
            </div>
          </div>
          {vehicle.city && (
            <div className="flex items-center gap-1 text-white/40">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">{vehicle.city}</span>
            </div>
          )}
        </div>

        {/* Price button */}
        <div className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 text-center">
          <span className="text-white text-[11px] font-black uppercase tracking-widest">PRECIO EXCLUSIVO B2B</span>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          {[
            vehicle.year?.toString(),
            vehicle.km === 0 ? '0 KM' : `${vehicle.km?.toLocaleString('es-AR')} KM`,
            vehicle.fuelType,
          ].map((stat, i) => stat && (
            <div key={i} className="flex-1 bg-white/5 border border-white/10 rounded-full py-1.5 text-center">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-wide truncate px-1">{stat}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          className="w-full rounded-full h-10 font-black text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {}}
        >
          VER DETALLE
        </Button>
      </div>
    </div>
  );
}

function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-bold uppercase tracking-tight text-sm text-white">{item.q}</span>
        <Plus className={`h-4 w-4 text-primary shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-white/50 font-medium leading-relaxed"
        >
          {item.a}
        </motion.p>
      )}
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (searchParams.get('register') === 'true') setIsAdmissionOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setIsVideoLoaded(true);
    }
    const timer = setTimeout(() => setIsVideoLoaded(true), 2500); // Max wait time 2.5s
    return () => clearTimeout(timer);
  }, []);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestVehicles, setLatestVehicles] = useState<Vehicle[]>([]);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cuil, setCuil] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('plata');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | 'REVEN20' | 'REVENFREE60'>(null);
  const [instagramUser, setInstagramUser] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regLogoFile, setRegLogoFile] = useState<File | null>(null);
  const [regLogoPreview, setRegLogoPreview] = useState('');
  const regLogoInputRef = useRef<HTMLInputElement>(null);

  const { provincias: regProvincias, localidades: regLocalidades, loadingProvincias: regLoadingProvincias, loadingLocalidades: regLoadingLocalidades } = useGeoRef(regProvince);

  const isFreeTrial = appliedCoupon === 'REVENFREE60';

  useEffect(() => {
    const unsub = subscribeToVehicles(
      (data) => setLatestVehicles(data.slice(0, 4)),
      (err) => console.error('Error fetching latest vehicles:', err)
    );
    return unsub;
  }, []);

  const handleApplyDiscount = () => {
    const code = discountCode.toUpperCase().trim();
    if (code === 'REVEN20') { setAppliedCoupon('REVEN20'); setError(null); }
    else if (code === 'REVENFREE60') { setAppliedCoupon('REVENFREE60'); setError(null); }
    else setError('Código de descuento inválido');
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    if (!regProvince || !regCity) {
      setError('Seleccioná tu provincia y localidad.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: `${name} ${lastName}` });

      let logoUrl: string | null = null;
      if (regLogoFile) {
        const logoRef = storageRef(storage, `users/${user.uid}/logo_${Date.now()}`);
        await uploadBytes(logoRef, regLogoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, email, name, lastName, cuil, phone, company,
        plan, billingCycle, discountCode: appliedCoupon ?? null,
        trialDays: isFreeTrial ? 60 : null, role: 'USER', status: 'pending',
        province: regProvince, city: regCity,
        instagram: instagramUser || null,
        avatarUrl: logoUrl,
        logoUrl,
        createdAt: serverTimestamp(),
      });
      setIsAdmissionOpen(false);
      navigate('/login');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('El email ya se encuentra registrado. Intentá iniciar sesión.');
      else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else {
        handleFirestoreError(err, OperationType.WRITE, 'users');
        setError('Error al crear la cuenta. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentPlanPrices = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

  const PLANS = [
    {
      key: 'plata', displayName: 'PROFESIONAL', ...PLAN_PRICES.plata, popular: false,
      features: ['Hasta 5 autos publicados', 'Agencias hasta 2 sucursales', '3 destacados por mes', 'Datos de mercado básicos', '1 usuario por cuenta', 'Contacto directo B2B'],
      cta: 'SOLICITÀ TU ACCESO',
    },
    {
      key: 'oro', displayName: 'BUSINESS', ...PLAN_PRICES.oro, popular: true,
      features: ['Hasta 15 autos publicados', 'Concesionarias medianas', '15 destacados por mes', 'Datos completos', 'Alertas personalizadas', '3 usuarios', 'Contacto directo B2B'],
      cta: 'SOLICITÀ TU ACCESO',
    },
    {
      key: 'platinum', displayName: 'ENTERPRISE', ...PLAN_PRICES.platinum, popular: false,
      features: ['Autos ilimitados', 'Grupos automotrices', 'Destacados ilimitados', 'Acceso API', 'Alertas personalizadas', 'Usuarios ilimitados', 'Account manager'],
      cta: 'CONTACTAR VENTAS',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300 overflow-x-hidden">
      <AnimatePresence>
        {!isVideoLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            >
              <Logo className="text-7xl md:text-8xl" variant="auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden -mt-24">
        <div className="absolute inset-0 z-0">
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline 
            preload="auto"
            onCanPlayThrough={() => setIsVideoLoaded(true)}
            onLoadedData={() => setIsVideoLoaded(true)}
            className="w-full h-full object-cover opacity-50 bg-[#111]"
          >
            <source src="/hero1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto relative z-10 px-4 md:px-8 lg:px-12 py-32 pt-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-8"
          >
            <Badge className="bg-primary/15 backdrop-blur-sm border border-primary/40 text-primary font-black tracking-widest px-5 py-2 rounded-full text-[10px] md:text-xs uppercase">
              LA RED DE TRADING B2B N°1 DE ARGENTINA
            </Badge>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter uppercase leading-[0.9] text-white break-words">
              EL <span className="text-primary">FUTURO</span> DEL <br />
              NEGOCIO <br />
              AUTOMOTOR
            </h1>

            <p className="text-base md:text-lg text-white/60 font-medium max-w-lg leading-relaxed">
              Marketplace exclusivo B2B, solo para profesionales verificados.<br />
              Sin intermediarios. Sin público final. Solo negocios reales.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                className="h-14 px-10 rounded-full font-black text-base uppercase tracking-tight italic shadow-2xl shadow-primary/30 group bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsAdmissionOpen(true)}
              >
                SOLICITÀ TU ACCESO
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-full font-black text-base uppercase tracking-tight italic border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                VER VIDEO DEMO
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Solutions ──────────────────────────────────────────────────── */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-white mb-4">
              HACÉ NEGOCIOS B2B <br />
              <span className="text-primary italic">RÁPIDOS, SEGUROS Y RENTABLES.</span>
            </h2>
            <p className="text-sm font-bold uppercase tracking-widest text-white/40 leading-relaxed max-w-sm">
              Olvidate del mercado informal y los grupos ruidosos. Bienvenido al estándar profesional.
            </p>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] items-stretch min-h-[480px]">
            {/* Left column */}
            <div className="space-y-10 py-8 lg:pr-8 z-10">
              {SOLUTIONS_LEFT.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <point.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-black uppercase tracking-widest text-sm text-white">{point.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40 leading-relaxed">{point.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Center phone — absolute, spans full column height */}
            <div className="hidden lg:block relative">
              <img
                src="/celular.jpeg"
                alt="App REVEN"
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', maskComposite: 'intersect', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskComposite: 'source-in' }}
              />
            </div>

            {/* Right column */}
            <div className="space-y-10 py-8 lg:pl-8 z-10">
              {SOLUTIONS_RIGHT.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <point.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-black uppercase tracking-widest text-sm text-white">{point.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40 leading-relaxed">{point.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] border-t border-white/5">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-12 order-2 lg:order-1">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border border-primary/30 font-black tracking-widest px-4 py-1.5 rounded-full text-[10px] uppercase">
                  PROCESO DE INGRESO
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                  OPERÁ EN LA RED EN <br />
                  <span className="text-primary italic">3 SIMPLES PASOS</span>
                </h2>
              </div>

              <div className="space-y-10">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-black shadow-lg shadow-primary/20">
                      {step.number}
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <h3 className="text-base font-black tracking-widest uppercase text-white">{step.title}</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="h-14 px-10 rounded-full font-black uppercase tracking-tight italic bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 group text-base"
                onClick={() => setIsAdmissionOpen(true)}
              >
                COMENZAR AHORA
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 relative flex justify-center lg:justify-end"
            >
              <div className="relative">
                <img
                  src="/hombre-polo-reven.png"
                  alt="Profesional REVEN"
                  className="max-h-[560px] w-auto object-contain object-top"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                {/* Funde el corte inferior con el fondo */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent pointer-events-none" />
                {/* Funde el lateral izquierdo */}
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Latest Vehicles ───────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/5">
          <div className="container mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-white leading-none">
                  ÚLTIMOS <br /><span className="text-primary">INGRESOS.</span>
                </h2>
              </div>
              <Button
                variant="outline"
                className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest border-white/20 text-white bg-transparent hover:bg-white/5"
                asChild
              >
                <Link to="/login">VER CATÁLOGO COMPLETO</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {latestVehicles.map((car) => (
                <HomeCarCard key={car.id} vehicle={car} />
              ))}
            </div>
          </div>
        </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 bg-[#0a0a0a] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <img src="/asfalto.jpeg" alt="" className="w-full h-full object-cover" onError={() => {}} />
        </div>
        <div className="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white leading-none">
              INVERTÍ EN TU <br />
              <span className="text-primary italic">MAYOR CANAL</span> DE VENTAS.
            </h2>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-5 mb-16">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-white/30'}`}
            >
              MENSUAL
            </button>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${billingCycle === 'annual' ? 'bg-primary' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBillingCycle('annual')}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-white/30'}`}
              >
                ANUAL
              </button>
              <span className="bg-primary/20 text-primary border border-primary/30 font-black text-[9px] tracking-wider px-2 py-0.5 rounded-full uppercase">
                HOT OFF
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {PLANS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-3xl border flex flex-col transition-all duration-300
                  ${p.popular
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                  }`}
              >
                <div className="mb-8">
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${p.popular ? 'text-primary-foreground/70' : 'text-white/40'}`}>
                    {p.displayName}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl md:text-4xl font-black tracking-tighter ${p.popular ? 'text-primary-foreground' : 'text-white'}`}>
                      {formatARS(billingCycle === 'annual' ? p.annual : p.monthly)}
                    </span>
                    <span className={`text-xs font-bold uppercase ${p.popular ? 'text-primary-foreground/60' : 'text-white/40'}`}>
                      / {billingCycle === 'annual' ? 'año' : 'mes'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className={`text-[10px] font-black uppercase tracking-wider mt-2 ${p.popular ? 'text-primary-foreground/70' : 'text-primary'}`}>
                      AHORRÁS {formatARS(p.monthly * 12 - p.annual)}
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {p.features.map((feature, j) => (
                    <li key={j} className={`flex items-center gap-3 text-xs font-bold uppercase tracking-wide ${p.popular ? 'text-primary-foreground/90' : 'text-white/60'}`}>
                      <Check className={`h-3.5 w-3.5 shrink-0 stroke-[3] ${p.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-12 rounded-full font-black text-xs uppercase tracking-widest transition-all
                    ${p.popular
                      ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  onClick={() => setIsAdmissionOpen(true)}
                >
                  {p.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#0a0a0a] border-t border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 items-start">
            {/* Left */}
            <div className="space-y-8 lg:sticky lg:top-32">
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white leading-none">
                  PREGUNTAS <br /><span className="text-primary italic">FRECUENTES.</span>
                </h2>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/40 leading-relaxed max-w-xs">
                  Explorá las dudas más comunes sobre el ecosistema REVEN y maximizá tu experiencia B2B.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">SOPORTE TÉCNICO 24/7</p>
                <p className="text-sm font-bold text-white">¿Necesitás hablar con un gestor?</p>
                <button
                  className="text-sm font-black uppercase tracking-widest text-primary hover:underline"
                  onClick={() => setIsAdmissionOpen(true)}
                >
                  CHAT EN VIVO AHORA.
                </button>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-40 md:py-56 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Static image base — always visible */}
          <img
            src="/aparcadero.jpg"
            alt="Car lot"
            className="w-full h-full object-cover opacity-40"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1920';
            }}
          />
          {/* Video overlay — plays on top if available */}
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src="/video3.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-white leading-[1]">
              ¿QUÉ ESPERÁS <br />
              PARA <br />
              SUMARTE?
            </h2>
            <Button
              size="lg"
              className="h-16 px-14 rounded-full font-black text-base uppercase tracking-tight italic bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30"
              onClick={() => setIsAdmissionOpen(true)}
            >
              SOLICITÀ TU ACCESO AHORA
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Admission Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isAdmissionOpen} onOpenChange={setIsAdmissionOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 rounded-[2.5rem] border-border bg-card/95 backdrop-blur-2xl shadow-2xl overflow-y-auto max-h-[90dvh]">
          <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[600px]">
            <div className="hidden md:flex md:col-span-4 lg:col-span-3 bg-primary p-10 flex-col justify-between text-primary-foreground relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 blur-3xl rounded-full" />
              <div className="z-10">
                <Logo variant="mono-white" className="text-4xl mb-6" />
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] mb-6">Unite a <br />la Elite</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">Accedé al stock más exclusivo de Argentina y potenciá tu rentabilidad B2B.</p>
              </div>
              <div className="z-10 space-y-4">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">100% Verificado</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 lg:col-span-9 p-8 md:p-12 bg-background/50">
              <DialogHeader className="mb-10 text-left">
                <DialogTitle className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Solicitud de Admisión</DialogTitle>
                <DialogDescription className="font-medium text-sm mt-3 text-muted-foreground/80">Completá tus datos profesionales para iniciar el proceso de verificación.</DialogDescription>
              </DialogHeader>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest text-center mb-6">{error}</div>
              )}

              <form className="space-y-6" onSubmit={handleAdmissionSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-name" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Nombre del Dueño / Apoderado</Label>
                    <Input id="pop-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-lastname" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Apellido</Label>
                    <Input id="pop-lastname" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-cuil" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">CUIL / CUIT</Label>
                    <Input id="pop-cuil" required value={cuil} onChange={(e) => setCuil(e.target.value)} placeholder="20-XXXXXXXX-X" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-phone" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Teléfono</Label>
                    <Input id="pop-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 11 ..." className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pop-company" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Concesionaria</Label>
                  <Input id="pop-company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Automotores Reven S.A." className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Provincia <span className="text-primary">*</span></Label>
                    <Select value={regProvince} onValueChange={v => { setRegProvince(v); setRegCity(''); }}>
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4">
                        <SelectValue placeholder={regLoadingProvincias ? 'Cargando...' : 'Seleccionar'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {regProvincias.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Localidad <span className="text-primary">*</span></Label>
                    <Select value={regCity} onValueChange={setRegCity} disabled={!regProvince || regLoadingLocalidades}>
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4">
                        <SelectValue placeholder={regLoadingLocalidades ? 'Cargando...' : 'Seleccionar'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {regLocalidades.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-email" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Email Corporativo</Label>
                    <Input id="pop-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@concesionaria.com" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-pass" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Contraseña</Label>
                    <Input id="pop-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4" />
                  </div>
                </div>

                {/* Logo / foto de la concesionaria */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">
                    Logo / Foto de la concesionaria <span className="text-muted-foreground/50 normal-case tracking-normal font-medium">(opcional)</span>
                  </Label>
                  <input
                    ref={regLogoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setRegLogoFile(f); setRegLogoPreview(URL.createObjectURL(f)); }
                    }}
                  />
                  <div className="flex items-center gap-4">
                    {regLogoPreview ? (
                      <div className="h-14 w-14 rounded-2xl border-2 border-primary/30 overflow-hidden bg-muted shrink-0">
                        <img src={regLogoPreview} alt="logo" className="w-full h-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center shrink-0">
                        <Camera className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => regLogoInputRef.current?.click()}
                      className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 border-border"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {regLogoPreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </Button>
                  </div>
                </div>

                {/* Optional Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="pop-insta" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">
                    Instagram <span className="text-muted-foreground/50 normal-case tracking-normal font-medium">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pop-insta"
                      value={instagramUser}
                      onChange={(e) => setInstagramUser(e.target.value.replace('@', ''))}
                      placeholder="tu_usuario"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm pl-10 pr-4"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Plan</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4">
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="plata">PLAN PROFESIONAL</SelectItem>
                        <SelectItem value="oro">PLAN BUSINESS</SelectItem>
                        <SelectItem value="platinum">PLAN ENTERPRISE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Facturación</Label>
                    <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-background/50 border border-border p-1">
                        <TabsTrigger value="monthly" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Mensual</TabsTrigger>
                        <TabsTrigger value="annual" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Anual</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${isFreeTrial ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-primary/5 border-primary/10'}`}>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total a pagar</p>
                    {isFreeTrial ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">{formatARS(billingCycle === 'monthly' ? currentPlanPrices.monthly : currentPlanPrices.annual)}</span>
                        <span className="text-2xl font-black tracking-tighter text-emerald-400">A$0</span>
                        <span className="text-xs text-muted-foreground">/ 60 días</span>
                      </div>
                    ) : (
                      <p className="text-xl font-bold tracking-tighter text-primary">
                        {formatARS(billingCycle === 'monthly' ? currentPlanPrices.monthly : currentPlanPrices.annual)}
                        <span className="text-xs text-muted-foreground ml-1">/ {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                      </p>
                    )}
                  </div>
                  {isFreeTrial ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold tracking-tighter px-3 py-1 rounded-full text-[10px]">60 DÍAS GRATIS</Badge>
                  ) : billingCycle === 'annual' && (
                    <Badge className="bg-primary text-primary-foreground font-bold tracking-tighter px-3 py-1 rounded-full text-[10px]">
                      AHORRÁS {formatARS(currentPlanPrices.monthly * 12 - currentPlanPrices.annual)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pop-discount" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Código de Descuento</Label>
                  <div className="flex gap-2">
                    <Input id="pop-discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="REVEN20" className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4 flex-1" />
                    <Button type="button" variant="secondary" onClick={handleApplyDiscount} className="h-12 rounded-xl font-bold px-6">APLICAR</Button>
                  </div>
                  {appliedCoupon === 'REVENFREE60' && <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest ml-1">60 días gratis aplicados</p>}
                  {appliedCoupon === 'REVEN20' && <p className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Descuento aplicado</p>}
                </div>

                <div className="flex items-start space-x-4 pt-2">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked === true)} className="mt-1 border-primary h-5 w-5 rounded-md" />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="terms" className="text-[11px] font-bold uppercase tracking-wide leading-none cursor-pointer">
                      Acepto las{' '}
                      <button type="button" onClick={() => setShowTerms(true)} className="text-primary hover:underline">Bases y Condiciones</button>
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Declaro que soy un profesional del sector automotor.</p>
                  </div>
                </div>

                <Button type="submit" disabled={!acceptedTerms || loading} className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 mt-4 uppercase tracking-tighter">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ENVIAR SOLICITUD'}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Terms Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-border bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Bases Legales B2B REVEN
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4 mt-4 text-sm font-medium text-muted-foreground leading-relaxed">
            <section className="space-y-6">
              {[
                { t: '1. Objeto', c: 'REVEN es un ecosistema digital exclusivo para la compra y venta de vehículos entre concesionarias y revendedores profesionales (B2B).' },
                { t: '2. Verificación', c: 'Cada solicitud de admisión es auditada manualmente. El solicitante debe demostrar actividad comercial lícita mediante CUIT/CUIL.' },
                { t: '3. Transparencia', c: 'Los vendedores se comprometen a declarar el estado real de las unidades.' },
                { t: '4. Confidencialidad', c: 'Toda información de precios mayoristas es estrictamente confidencial.' },
              ].map((s, i) => (
                <div key={i}>
                  <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">{s.t}</h4>
                  <p>{s.c}</p>
                </div>
              ))}
            </section>
          </ScrollArea>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowTerms(false)} className="rounded-xl font-black uppercase tracking-tighter italic">Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer onAdmissionClick={() => setIsAdmissionOpen(true)} onTermsClick={() => setShowTerms(true)} />
    </div>
  );
}
