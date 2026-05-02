import { motion, useScroll, useTransform } from 'motion/react';
import { Shield, Zap, Star, Users, Check, ArrowRight, Quote, Star as StarIcon, X, Mail, Lock, Building2, User, Phone, Fingerprint, CreditCard, ShieldCheck, FileText, Loader2, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import React, { useRef, useState, useEffect } from 'react';
import { Logo } from '../components/layout/Logo';
import { Footer } from '../components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
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
import { VehicleCard } from '@/src/components/marketplace/VehicleCard';

const REVIEWS = [
  { name: "Carlos Benítez", role: "Dueño de Automotores del Sur", comment: "Excelente plataforma. He cerrado más negocios en un mes que en todo el semestre pasado. La atención es cálida y profesional.", photo: "https://picsum.photos/seed/user1/100/100" },
  { name: "Marina Soler", role: "Gerente de Ventas - LuxCars", comment: "La exclusividad B2B es lo que necesitábamos. Sin curiosos, solo gente del rubro. Muy contenta con los resultados.", photo: "https://picsum.photos/seed/user2/100/100" },
  { name: "Juan Pablo Domínguez", role: "Representante de Agencias Unidas", comment: "REVEN cambió nuestra forma de rotar stock. El historial de inspecciones por concesionaria nos da una tranquilidad que no existe en otros sitios.", photo: "https://picsum.photos/seed/user3/100/100" },
  { name: "Ricardo Valenzuela", role: "Director de Plaza Motors", comment: "Atención rápida y eficiente. Los precios mayoristas son reales y competitivos. Recomiendo 100% la plataforma.", photo: "https://picsum.photos/seed/user4/100/100" },
  { name: "Sofía Navarro", role: "Ventas Premium - Elite Auto", comment: "Hacer negocios entre colegas nunca fue tan fácil. La interfaz es moderna y muy intuitiva. ¡Gracias REVEN!", photo: "https://picsum.photos/seed/user5/100/100" },
  { name: "Diego Herrera", role: "Concesionaria Herrera Hnos", comment: "La mejor inversión del año. La calidad de los leads es superior. Se nota que hay un filtro real de admisión.", photo: "https://picsum.photos/seed/user6/100/100" },
  { name: "Lucía Morales", role: "Broker Independiente", comment: "Me encanta la rapidez de la plataforma. Publico y en minutos ya tengo consultas de colegas interesados.", photo: "https://picsum.photos/seed/user7/100/100" },
  { name: "Gabriel Vaca", role: "Gerente General - Nordelta Cars", comment: "Un entorno seguro para operar. La gestoría interna nos ahorra muchísimo tiempo administrativo.", photo: "https://picsum.photos/seed/user8/100/100" },
  { name: "Valeria Ortiz", role: "Dueña de Ortiz Automotores", comment: "Estamos haciendo más y mejores negocios. La comunidad es muy activa y profesional. Excelente soporte.", photo: "https://picsum.photos/seed/user9/100/100" },
  { name: "Marcos Galarza", role: "Ventas - Galarza Trucks", comment: "El sistema de inspecciones verificadas es impecable. Compro con confianza sabiendo el historial de cada concesionaria.", photo: "https://picsum.photos/seed/user10/100/100" },
  { name: "Ana Belén Castro", role: "Directora - BA Motors", comment: "La plataforma es impecable. El diseño y las animaciones le dan un toque premium que el sector necesitaba.", photo: "https://picsum.photos/seed/user11/100/100" },
  { name: "Fernando Silveira", role: "Agencia Silveira", comment: "Muy satisfecho con la membresía Platinum. La rotación de stock es constante. Gran herramienta de trabajo.", photo: "https://picsum.photos/seed/user12/100/100" },
  { name: "Patricia Méndez", role: "Ventas Corporativas", comment: "La calidez en la atención marca la diferencia. Siempre dispuestos a ayudar a que el negocio crezca.", photo: "https://picsum.photos/seed/user13/100/100" },
  { name: "Esteban Cardozo", role: "Cardozo Automotores", comment: "Precios diferenciales que realmente sirven. He mejorado mis márgenes operativos desde que uso REVEN.", photo: "https://picsum.photos/seed/user14/100/100" },
  { name: "Mónica Peralta", role: "Gerente - Peralta Autos", comment: "Excelente comunidad. El marketplace cerrado evita perder tiempo con ofertas poco serias.", photo: "https://picsum.photos/seed/user15/100/100" },
  { name: "Roberto Giménez", role: "Giménez & Co", comment: "La mejor plataforma B2B de Argentina. Sin dudas. Todo funciona a la perfección.", photo: "https://picsum.photos/seed/user16/100/100" },
  { name: "Claudio Rivas", role: "Rivas Automotores", comment: "Muy contento con los resultados. La plataforma es rápida y los colegas son muy profesionales.", photo: "https://picsum.photos/seed/user17/100/100" },
  { name: "Sandra Quiroga", role: "Ventas - SQ Cars", comment: "REVEN nos permitió expandir nuestra red de contactos en todo el país. Muy recomendable.", photo: "https://picsum.photos/seed/user18/100/100" },
  { name: "Jorge Blanco", role: "Blanco Motors", comment: "La atención es de primera. Siempre están atentos a cualquier duda. Los negocios fluyen.", photo: "https://picsum.photos/seed/user19/100/100" },
  { name: "Mirtha Villalba", role: "Villalba Luxury", comment: "Una joya de plataforma. Exclusividad y buen gusto en cada detalle. Los mejores autos están acá.", photo: "https://picsum.photos/seed/user20/100/100" },
  { name: "Susana Duarte", role: "Duarte Cars", comment: "¡Me encanta! Es súper fácil de usar y los resultados son inmediatos. ¡Hagan negocios con REVEN!", photo: "https://picsum.photos/seed/user21/100/100" },
  { name: "Marcelo Ibarra", role: "Ibarra Motors", comment: "Innovación pura para el sector automotor. Hacía falta algo así en Argentina. Gran trabajo.", photo: "https://picsum.photos/seed/user22/100/100" },
  { name: "Adrián Vera", role: "Vera Cars", comment: "Dinámica, rápida y efectiva. La plataforma ideal para el revendedor moderno.", photo: "https://picsum.photos/seed/user23/100/100" },
  { name: "Guillermo Ríos", role: "Ríos Automotores", comment: "¡A comerla! Los mejores negocios se hacen acá. La comunidad es de fierro.", photo: "https://picsum.photos/seed/user24/100/100" },
  { name: "Ricardo Luna", role: "Luna Premium", comment: "Seriedad y compromiso. REVEN es el socio que toda agencia debería tener.", photo: "https://picsum.photos/seed/user25/100/100" },
  { name: "Lionel Paredes", role: "Rosario Cars", comment: "La mejor del mundo. Hacemos negocios en equipo y siempre ganamos. ¡Vamos REVEN!", photo: "https://picsum.photos/seed/user26/100/100" },
  { name: "Ángel Romero", role: "Romero Motors", comment: "Goles de media cancha con cada venta. La plataforma es una maravilla.", photo: "https://picsum.photos/seed/user27/100/100" },
  { name: "Rodrigo Sosa", role: "Sosa Motors", comment: "Intensidad y buenos negocios. REVEN no para nunca. Muy contento.", photo: "https://picsum.photos/seed/user28/100/100" },
  { name: "Emiliano Martínez", role: "Martínez Cars", comment: "Atajamos las mejores oportunidades. La seguridad de la plataforma es total.", photo: "https://picsum.photos/seed/user29/100/100" },
  { name: "Julián Fernández", role: "Fernández Motors", comment: "Picamos en punta con REVEN. La rotación de stock es increíble.", photo: "https://picsum.photos/seed/user30/100/100" },
];

const REVIEWS_ROW_1 = REVIEWS.slice(0, 15);
const REVIEWS_ROW_2 = REVIEWS.slice(15, 30);



const STEPS = [
  { number: "01", title: "Solicitá Admisión", desc: "Completá el formulario con tus datos profesionales y de tu concesionaria." },
  { number: "02", title: "Verificación", desc: "Auditamos tu perfil para asegurar que sos un profesional real del sector." },
  { number: "03", title: "Operá en la Red", desc: "Accedé al stock exclusivo, comprá y vendé con máxima rentabilidad." },
];

const CATEGORIES = [
  { name: "Pickups", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800", count: 24 },
  { name: "SUV & Crossover", image: "https://images.unsplash.com/photo-1606577924006-27d39b132ee6?auto=format&fit=crop&q=80&w=800", count: 18 },
  { name: "Sedanes", image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800", count: 12 },
  { name: "Premium", image: "https://images.unsplash.com/photo-1542362567-b055002b91f4?auto=format&fit=crop&q=80&w=800", count: 8 },
];

function ReviewCard({ review }: { review: typeof REVIEWS[0], key?: any }) {
  return (
    <div className="flex-shrink-0 w-[350px] p-6 rounded-[2rem] bg-card/40 backdrop-blur-md border border-border hover:border-primary/20 transition-all mx-3">
      <div className="flex items-center gap-4 mb-4">
        <img src={review.photo} alt={review.name} className="h-12 w-12 rounded-full border-2 border-primary/20" />
        <div>
          <h5 className="font-bold text-sm uppercase tracking-tighter">{review.name}</h5>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{review.role}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className="h-3 w-3 fill-primary text-primary" />
        ))}
      </div>
      <div className="relative">
        <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/10 -z-10" />
        <p className="text-sm text-foreground/80 font-medium leading-relaxed italic line-clamp-3">"{review.comment}"</p>
      </div>
    </div>
  );
}

function InfiniteSlider({ reviews, direction = "left" }: { reviews: typeof REVIEWS, direction?: "left" | "right" }) {
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        className="flex"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"]
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {[...reviews, ...reviews].map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </motion.div>
    </div>
  );
}

export function Home() {
  const parallaxRef = useRef(null);
  const socioRef = useRef(null);
  const navigate = useNavigate();
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestVehicles, setLatestVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const unsub = subscribeToVehicles(
      (data) => setLatestVehicles(data.slice(0, 4)),
      (err) => console.error("Error fetching latest vehicles:", err)
    );
    return unsub;
  }, []);

  // Form States
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cuil, setCuil] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('plata');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const PLAN_PRICES = {
    plata: { monthly: 120, annual: 999 },
    oro: { monthly: 180, annual: 1500 },
    platinum: { monthly: 300, annual: 2500 }
  };

  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'REVEN20') {
      setIsDiscountApplied(true);
      setError(null);
    } else {
      setError('Código de descuento inválido');
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${name} ${lastName}`
      });

      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          name: name,
          lastName: lastName,
          cuil: cuil,
          phone: phone,
          company: company,
          plan: plan,
          billingCycle: billingCycle,
          discountCode: isDiscountApplied ? discountCode : null,
          role: 'USER',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, userPath);
      }

      setIsAdmissionOpen(false);
      navigate('/login');
      // Note: We could show a success message here or redirect to a "thank you" page
    } catch (err: any) {
      console.error(err);
      setError('Error al procesar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  const { scrollYProgress: socioScroll } = useScroll({
    target: socioRef,
    offset: ["start end", "end start"]
  });

  const socioY = useTransform(socioScroll, [0, 1], ["-10%", "10%"]);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20 lg:py-0">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto relative z-10 px-6 md:px-12 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl space-y-6 md:space-y-8 text-center lg:text-left"
            >
              <Badge className="bg-primary/20 text-primary border-primary/20 font-semibold tracking-tighter px-6 py-2 rounded-full text-sm inline-flex">
                COMUNIDAD EXCLUSIVA B2B
              </Badge>
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.9] text-foreground">
                EL FUTURO DEL <br />
                NEGOCIO <br />
                AUTOMOTOR
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed mx-auto lg:mx-0">
                La plataforma privada donde los profesionales de Argentina compran y venden stock verificado con máxima rentabilidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-12 md:h-16 px-6 md:px-10 rounded-xl font-bold text-base md:text-lg shadow-xl shadow-primary/20 group uppercase tracking-tighter w-full sm:w-auto"
                  onClick={() => setIsAdmissionOpen(true)}
                >
                  SOLICITAR ADMISIÓN
                  <ArrowRight className="ml-2 h-5 md:h-6 w-5 md:w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 md:h-16 px-6 md:px-10 rounded-xl font-bold text-base md:text-lg border-border hover:bg-primary/5 uppercase tracking-tighter w-full sm:w-auto"
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing');
                    pricingSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  VER PLANES
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" />
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000"
                alt="Car"
                className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl border border-white/20"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar - Carent Style */}
      <section className="py-12 bg-background border-b border-border/50 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 mx-auto">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 mb-8">CONFIAN EN NOSOTROS LAS MEJORES CONCESIONARIAS</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            {['Toyota', 'Ford', 'Volkswagen', 'Chevrolet', 'BMW', 'Mercedes'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-bold tracking-tighter uppercase">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section - Carent Style Redesign */}
      <section className="py-24 md:py-32 bg-foreground text-background dark:bg-muted/20 dark:text-foreground relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none font-bold tracking-tighter px-4 py-1 rounded-full text-xs">
                  PROCESO DE INGRESO
                </Badge>
                <h2 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-none text-background dark:text-foreground">
                  Operá en la red en <br />
                  <span className="text-primary">3 simples pasos</span>
                </h2>
              </div>

              <div className="space-y-8">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start group"
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      {step.number}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tighter uppercase text-background dark:text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground font-medium leading-relaxed max-w-md">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="h-16 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 group uppercase tracking-tighter"
                onClick={() => setIsAdmissionOpen(true)}
              >
                COMENZAR AHORA
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 animate-pulse" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-2xl font-bold tracking-tighter uppercase">Red Verificada</p>
                  <p className="text-sm text-white/60 font-medium">+500 operaciones mensuales</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Units Section */}
      <section className="py-24 bg-foreground text-background dark:bg-muted/20 dark:text-foreground">
        <div className="container mx-auto px-6 md:px-12 mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 mb-12 text-center sm:text-left">
            <div className="space-y-2">
              <Badge className="bg-primary/20 text-primary border-none font-bold tracking-tighter px-4 py-1 rounded-full text-xs inline-flex">
                RECIÉN INGRESADOS
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase text-background dark:text-foreground">Ultimos Ingresos</h2>
            </div>
            <Button variant="link" className="text-primary font-bold uppercase tracking-widest text-xs group" asChild>
              <Link to="/login">
                VER TODO EL STOCK
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVehicles.map((car, i) => (
              <VehicleCard key={car.id} vehicle={car} />
            ))}
          </div>
        </div>
      </section>


      {/* Features / Why Reven */}
      <section ref={socioRef} className="relative py-24 md:py-32 overflow-hidden bg-background">
        <motion.div
          style={{ y: socioY }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920"
            alt="Business Background"
            className="w-full h-[120%] object-cover opacity-10 dark:opacity-20 grayscale"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="container mx-auto px-6 md:px-12 mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 uppercase">Tu Socio Estratégico</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">Optimizamos la compra y venta de unidades para maximizar la rentabilidad de tu concesionaria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Historial de Inspecciones Verificadas',
                desc: 'Consultá el registro de inspecciones realizadas por cada concesionaria. Transparencia total: conocé la trayectoria operativa y el nivel de rigurosidad de cada miembro de la red.'
              },
              {
                icon: Zap,
                title: 'Compra Mayorista',
                desc: 'Accedé a un stock exclusivo con precios mayoristas y condiciones preferenciales diseñadas únicamente para revendedores.'
              },
              {
                icon: Star,
                title: 'Venta Diferencial',
                desc: 'No solo comprás; también podés liquidar tu stock excedente vendiendo a otros profesionales a precios diferenciales de mercado.'
              },
              {
                icon: Users,
                title: 'Gestoría Interna',
                desc: 'Nos encargamos de que toda la documentación esté lista para transferir. Retirá la unidad y vendela sin demoras administrativas.'
              },
              {
                icon: Check,
                title: 'Marketplace Cerrado',
                desc: 'Un entorno seguro y privado. Sin curiosos ni consumidores finales. Solo operaciones reales entre colegas del sector.'
              },
              {
                icon: Shield,
                title: 'Rentabilidad Máxima',
                desc: 'Nuestras herramientas están orientadas a mejorar tus márgenes operativos mediante rotación rápida de stock verificado.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-10 rounded-[3rem] bg-background border border-border/50 hover:border-primary/30 transition-all group hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-2xl font-bold mb-4 uppercase tracking-tighter">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax Reviews Section */}
      <section ref={parallaxRef} className="relative py-24 md:py-32 overflow-hidden bg-black">
        <motion.div
          style={{ y }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2923216?auto=format&fit=crop&q=80&w=1920"
            alt="Handshake Background"
            className="w-full h-[140%] object-cover opacity-40 blur-[2px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </motion.div>

        <div className="relative z-10">
          <div className="container mx-auto px-6 md:px-12 mx-auto text-center mb-16">
            <Badge className="bg-primary/20 text-primary border-none font-bold tracking-tighter px-6 py-2 rounded-full text-sm mb-6 inline-flex">
              TESTIMONIOS REALES
            </Badge>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none text-white">
              LA VOZ DE LA <br />
              <span className="text-primary">COMUNIDAD</span>
            </h2>
          </div>

          <div className="space-y-4">
            <InfiniteSlider reviews={REVIEWS_ROW_1} direction="left" />
            <InfiniteSlider reviews={REVIEWS_ROW_2} direction="right" />
          </div>
        </div>
      </section>

      {/* Pricing / Memberships */}
      <section id="pricing" className="py-24 md:py-32 bg-foreground text-background dark:bg-muted/20 dark:text-foreground relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-0" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full -z-0" />

        <div className="container mx-auto px-6 md:px-12 mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6 text-background dark:text-foreground">Planes de Membresía</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium">Elegí el nivel de acceso que mejor se adapte al volumen de tu negocio.</p>
          </div>

          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-background dark:text-foreground' : 'text-muted-foreground'}`}>Mensual</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${billingCycle === 'annual' ? 'bg-primary' : 'bg-muted-foreground/40'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${billingCycle === 'annual' ? 'text-background dark:text-foreground' : 'text-muted-foreground'}`}>
              Anual
              <Badge className="ml-2 bg-primary text-primary-foreground text-[10px] font-black tracking-tighter px-2 py-0.5 rounded-full">AHORRÁ HASTA 31%</Badge>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto items-center">
            {[
              {
                name: 'Plata',
                monthly: 120,
                annual: 999,
                features: ['Hasta 5 autos publicados', 'Acceso al Marketplace B2B', 'Mensajería directa', 'Soporte estándar'],
                popular: false,
                color: 'border-border'
              },
              {
                name: 'Oro',
                monthly: 180,
                annual: 1500,
                features: ['Hasta 25 autos publicados', 'Acceso al Marketplace B2B', 'Mensajería prioritaria', 'Soporte 24/7', 'Badge de Verificado'],
                popular: true,
                color: 'border-primary shadow-primary/20'
              },
              {
                name: 'Platinum',
                monthly: 300,
                annual: 2500,
                features: ['Hasta 150 autos publicados', 'Acceso al Marketplace B2B', 'Gestoría preferencial', 'Destacados ilimitados', 'Account Manager dedicado'],
                popular: false,
                color: 'border-secondary shadow-secondary/20'
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-12 rounded-[3.5rem] border-2 ${plan.popular ? 'bg-primary/5 scale-110 z-10' : 'bg-card/50 scale-100'} ${plan.color} flex flex-col transition-all duration-500 hover:shadow-2xl`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-black tracking-tighter px-8 py-2.5 rounded-full text-sm shadow-xl shadow-primary/40">
                    MÁS ELEGIDO
                  </Badge>
                )}
                <div className="mb-10">
                  <h3 className={`text-4xl font-black tracking-tighter uppercase mb-3 ${plan.popular ? 'text-primary' : 'text-background dark:text-foreground'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tracking-tighter text-background dark:text-foreground">
                      U$D {billingCycle === 'annual' ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-sm">/ {billingCycle === 'annual' ? 'año' : 'mes'}</span>
                  </div>
                  {billingCycle === 'annual' ? (
                    <p className="text-primary font-black text-base mt-5 tracking-tighter uppercase bg-primary/10 inline-block px-4 py-1 rounded-full">
                      AHORRÁS U$D {plan.monthly * 12 - plan.annual}
                    </p>
                  ) : (
                    <p className="text-muted-foreground font-bold text-base mt-5 tracking-tighter uppercase inline-block px-4 py-1">
                      U$D {plan.annual} / año
                    </p>
                  )}
                </div>

                <ul className="space-y-6 mb-14 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-5 text-base font-bold text-background/90 dark:text-foreground/90">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-16 rounded-2xl font-black text-xl uppercase tracking-tighter transition-all ${plan.popular ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105' : 'variant-outline border-border hover:bg-primary/10'}`}
                  onClick={() => setIsAdmissionOpen(true)}
                >
                  SOLICITAR ADMISIÓN
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 p-12 rounded-[3rem] bg-background/5 dark:bg-card/50 border border-border/20 text-center max-w-4xl mx-auto backdrop-blur-sm">
            <h3 className="text-3xl font-bold tracking-tighter uppercase mb-4 text-background dark:text-foreground">¿Necesitás más volumen?</h3>
            <p className="text-muted-foreground font-medium mb-8">Para redes de concesionarias o grandes flotas, tenemos soluciones Enterprise a medida.</p>
            <Button
              className="h-14 px-10 rounded-2xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-tighter shadow-xl shadow-primary/20"
              onClick={() => setIsAdmissionOpen(true)}
            >
              CONSULTAR POR ENTERPRISE
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-8 leading-none text-primary-foreground">
            UNITE A LA RED MÁS <br />
            GRANDE DE ARGENTINA
          </h2>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 sm:h-20 px-8 sm:px-16 rounded-3xl font-bold text-lg sm:text-2xl shadow-2xl group uppercase tracking-tighter w-full sm:w-auto"
            onClick={() => setIsAdmissionOpen(true)}
          >
            SOLICITAR ACCESO AHORA
            <ArrowRight className="ml-2 sm:ml-3 h-5 sm:h-8 w-5 sm:w-8 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Admission Dialog */}
      <Dialog open={isAdmissionOpen} onOpenChange={setIsAdmissionOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 rounded-[2.5rem] border-border bg-card/95 backdrop-blur-2xl shadow-2xl overflow-y-auto max-h-[90dvh]">
          <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[600px]">
            <div className="hidden md:flex md:col-span-4 lg:col-span-3 bg-primary p-10 flex-col justify-between text-primary-foreground relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 blur-3xl rounded-full" />
              <div className="z-10">
                <Logo variant="dark" className="text-4xl mb-6" />
                <h3 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-[0.9] mb-6 text-primary-foreground">Unite a <br />la Elite</h3>
                <p className="text-sm md:text-base font-medium opacity-90 leading-relaxed">Accedé al stock más exclusivo de Argentina y potenciá tu rentabilidad B2B.</p>
              </div>
              <div className="z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">100% Verificado</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Operaciones Rápidas</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-8 lg:col-span-9 p-8 md:p-12">
              <DialogHeader className="mb-8 md:mb-12">
                <DialogTitle className="text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none">Solicitud de Admisión</DialogTitle>
                <DialogDescription className="font-medium text-sm md:text-base mt-3">Completá tus datos profesionales para iniciar el proceso de verificación.</DialogDescription>
              </DialogHeader>

              <form className="space-y-6" onSubmit={handleAdmissionSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-name" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Nombre</Label>
                    <Input
                      id="pop-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-lastname" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Apellido</Label>
                    <Input
                      id="pop-lastname"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Pérez"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-cuil" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">CUIL / CUIT</Label>
                    <Input
                      id="pop-cuil"
                      required
                      value={cuil}
                      onChange={(e) => setCuil(e.target.value)}
                      placeholder="20-XXXXXXXX-X"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-phone" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Teléfono</Label>
                    <Input
                      id="pop-phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 11 ..."
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pop-company" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Concesionaria</Label>
                  <Input
                    id="pop-company"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Automotores Reven S.A."
                    className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pop-email" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Email Corporativo</Label>
                    <Input
                      id="pop-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juan@concesionaria.com"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pop-pass" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Contraseña</Label>
                    <Input
                      id="pop-pass"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Plan de Membresía</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4">
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="plata">PLAN PLATA (Hasta 5 autos)</SelectItem>
                        <SelectItem value="oro">PLAN ORO (Hasta 25 autos)</SelectItem>
                        <SelectItem value="platinum">PLAN PLATINUM (Hasta 150 autos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Ciclo de Facturación</Label>
                    <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-background/50 border border-border p-1">
                        <TabsTrigger value="monthly" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Mensual</TabsTrigger>
                        <TabsTrigger value="annual" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Anual</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total a pagar</p>
                    <p className="text-xl font-bold tracking-tighter text-primary">
                      U$D {billingCycle === 'monthly' ? PLAN_PRICES[plan as keyof typeof PLAN_PRICES].monthly : PLAN_PRICES[plan as keyof typeof PLAN_PRICES].annual}
                      <span className="text-xs text-muted-foreground ml-1">/ {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                    </p>
                  </div>
                  {billingCycle === 'annual' && (
                    <Badge className="bg-primary text-primary-foreground font-bold tracking-tighter px-3 py-1 rounded-full text-[10px]">
                      AHORRÁ U$D {PLAN_PRICES[plan as keyof typeof PLAN_PRICES].monthly * 12 - PLAN_PRICES[plan as keyof typeof PLAN_PRICES].annual}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pop-discount" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Código de Descuento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pop-discount"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="REVEN20"
                      className="h-12 rounded-xl bg-background/50 border-border font-bold text-sm px-4 flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleApplyDiscount}
                      className="h-12 rounded-xl font-bold px-6"
                    >
                      APLICAR
                    </Button>
                  </div>
                  {isDiscountApplied && (
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">¡Descuento aplicado con éxito!</p>
                  )}
                </div>

                <div className="flex items-start space-x-4 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-5 w-5 rounded-md"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-[11px] font-bold uppercase tracking-wide leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Acepto las <button type="button" onClick={() => setShowTerms(true)} className="text-primary hover:underline">Bases y Condiciones</button>
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Declaro que soy un profesional del sector automotor.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!acceptedTerms || loading}
                  className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 mt-4 uppercase tracking-tighter"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ENVIAR SOLICITUD'}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-border bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Bases Legales B2B REVEN
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4 mt-4">
            <div className="space-y-6 text-sm font-medium text-muted-foreground leading-relaxed">
              <section>
                <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">1. Objeto de la Plataforma</h4>
                <p>REVEN es un ecosistema digital exclusivo para la compra y venta de vehículos entre concesionarias y revendedores profesionales (B2B). Queda terminantemente prohibido el acceso a consumidores finales.</p>
              </section>
              <section>
                <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">2. Verificación de Identidad</h4>
                <p>Cada solicitud de admisión es auditada manualmente. El solicitante debe demostrar actividad comercial lícita en el rubro automotor mediante CUIT/CUIL activo y referencias comerciales comprobables.</p>
              </section>
              <section>
                <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">3. Transparencia y Peritaje</h4>
                <p>Los vendedores se comprometen a declarar el estado real de las unidades. REVEN ofrece servicios de peritaje profesional que, una vez emitidos, son vinculantes para la descripción del vehículo en la plataforma.</p>
              </section>
              <section>
                <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">4. Operaciones y Pagos</h4>
                <p>REVEN facilita el contacto y la gestión documental, pero no interviene en la liquidación financiera de las unidades, la cual se rige por los usos y costumbres comerciales del sector automotor argentino.</p>
              </section>
              <section>
                <h4 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">5. Confidencialidad</h4>
                <p>Toda información de precios mayoristas y stock disponible es estrictamente confidencial. La filtración de datos a terceros o consumidores finales resultará en la expulsión inmediata y permanente de la red.</p>
              </section>
            </div>
          </ScrollArea>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowTerms(false)} className="rounded-xl font-bold uppercase tracking-tighter">Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer 
        onAdmissionClick={() => setIsAdmissionOpen(true)} 
        onTermsClick={() => setShowTerms(true)} 
      />
    </div>
  );
}
