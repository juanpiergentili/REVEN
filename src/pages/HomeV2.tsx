import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import heroVideo from '../video/hero1.mp4';
const footerVideo = '';
import { Zap, CreditCard, ShieldCheck, Users, Fingerprint, FileText } from 'lucide-react';
import video3 from '/video3.mp4';
import asfalto from '/asfalto.jpeg';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE EVENTOS (TRACKING)
// ─────────────────────────────────────────────────────────────────────────────
const trackEvent = (eventName: string, properties?: any) => {
  console.log(`[TRACKING EVENT]: ${eventName}`, properties || '');
};

const FAQS = [
  { q: "¿Por qué Reven no es gratis?", a: "Reven es un marketplace cerrado exclusivo para profesionales. Cobramos una membresía para garantizar que solo operen agencias verificadas y mantener la más alta calidad y seguridad en los negocios." },
  { q: "¿Puedo probar antes de pagar?", a: "Ofrecemos demos personalizadas en vivo donde te mostramos el stock real disponible en tu zona y las oportunidades de negocio inmediatas." },
  { q: "¿Hay permanencia mínima?", a: "No, en Reven operamos mes a mes. Queremos que te quedes por el valor que te generamos, no por un contrato." },
  { q: "¿Qué pasa si mi competencia directa está en Reven?", a: "Eso es una ventaja. El stock de tu competencia puede ser tu próxima oportunidad de venta para un cliente que ya tenés en el salón." },
  { q: "¿Quién puede ver mis precios?", a: "Solo otras agencias verificadas y auditadas por nosotros. Ningún consumidor final tiene acceso al marketplace ni a tus valores mayoristas." },
  { q: "¿Cómo cargo mi stock?", a: "Podés cargarlo manualmente en segundos, subir planillas o integrarte mediante API si usás un sistema de gestión compatible." },
  { q: "¿Puedo usar Reven si ya uso otro sistema de gestión?", a: "Absolutamente. Reven no reemplaza tu CRM, lo potencia dándote un canal de salida directo a cientos de colegas." }
];

const PLANS = [
  {
    name: "BUSINESS",
    price: { monthly: 200000, annual: 1560000 },
    features: ["Agencias hasta 2 sucursales", "Hasta 30 autos publicados", "3 destacados por mes", "Datos de mercado básicos", "1 usuario por cuenta", "Contacto directo B2B"],
    cta: "Solicitá tu acceso",
    popular: false
  },
  {
    name: "PROFESSIONAL",
    price: { monthly: 350000, annual: 2730000 },
    features: ["Concesionarias medianas", "Hasta 150 autos publicados", "15 destacados por mes", "Datos completos", "Alertas personalizadas", "3 usuarios", "Contacto directo B2B"],
    cta: "Solicitá tu acceso",
    popular: true
  },
  {
    name: "ENTERPRISE",
    price: { monthly: 500000, annual: 3900000 },
    features: ["Grupos automotrices", "Stock ilimitado", "Destacados ilimitados", "Acceso API", "Alertas personalizadas", "Usuarios ilimitados", "Account manager"],
    cta: "Contactar ventas",
    popular: false
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function HomeV2() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form State
  const [cuit, setCuit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [isCheckingCuit, setIsCheckingCuit] = useState(false);
  const [cuitStatus, setCuitStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');
  const [cuitError, setCuitError] = useState('');
  const [estadoCuit, setEstadoCuit] = useState('');

  const checkCuit = async (cuitValue: string) => {
    const cleanCuit = cuitValue.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      setCuitStatus('IDLE');
      setCuitError('');
      setRazonSocial('');
      setEstadoCuit('');
      return;
    }

    setIsCheckingCuit(true);
    setCuitError('');
    try {
      const apiKey = import.meta.env.VITE_CUITALIZER_API_KEY || ''; // Requiere que el usuario configure esto en .env
      
      const response = await fetch('https://api.cuitalizer.com.ar/api/v1/contribuyente/consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey })
        },
        body: JSON.stringify({ cuit: cleanCuit }),
      });

      if (!response.ok) {
        throw new Error('Error en validación');
      }

      const data = await response.json();
      
      // La API de cuitalizer comúnmente devuelve los datos dentro del objeto principal o en data
      const info = data.data || data;
      const nombre = info.razonSocial || info.razon_social || info.nombre || '';
      const estado = info.estadoVigencia || info.estado || info.estadoClave || '';
      
      if (nombre) {
        setRazonSocial(nombre);
        setEstadoCuit(estado);
        setCuitStatus('VALID');
        
        if (estado && estado.toUpperCase() !== 'ACTIVA' && estado.toUpperCase() !== 'ACTIVO') {
           setCuitError(`Estado en AFIP: ${estado} (Se requiere estado activo)`);
        } else {
           setCuitError('');
        }
      } else {
        throw new Error('CUIT no encontrado');
      }
    } catch (e) {
      console.error('Error fetching CUIT:', e);
      setCuitStatus('INVALID');
      setCuitError('CUIT inválido, no encontrado o falta API Key');
    } finally {
      setIsCheckingCuit(false);
    }
  };

  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCuit(val);
    if (val.replace(/\D/g, '').length === 11) {
       checkCuit(val);
    } else {
       setCuitStatus('IDLE');
       setCuitError('');
    }
  };
  
  useEffect(() => {
    trackEvent('page_view', { version: 'v2_sandbox_32_refined' });
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const { scrollYProgress: howItWorksScroll } = useScroll({
    target: howItWorksRef,
    offset: ["start end", "end end"]
  });

  const { scrollYProgress: pricingScroll } = useScroll({
    target: pricingRef,
    offset: ["start end", "end end"]
  });

  const { scrollYProgress: footerScroll } = useScroll({
    target: footerSectionRef,
    offset: ["start end", "end end"]
  });

  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  // How it works effects
  const howBlur = useTransform(howItWorksScroll, [0.3, 0.5, 0.7], ["blur(0px)", "blur(15px)", "blur(0px)"]);
  const howVideoY = useTransform(howItWorksScroll, [0, 1], [0, -150]);

  // Pricing effects
  const pricingBlur = useTransform(pricingScroll, [0.3, 0.5, 0.7], ["blur(0px)", "blur(8px)", "blur(0px)"]);
  const pricingY = useTransform(pricingScroll, [0, 1], [0, -100]);
  const pricingOpacity = 1; // Fixed 100% as requested

  // Footer effects derived from scroll
  const footerBlur = useTransform(footerScroll, [0.4, 0.7], ["blur(0px)", "blur(12px)"]); 
  const footerVideoOpacity = useTransform(footerScroll, [0.1, 0.5], [1, 0.6]);
  const footerVideoY = useTransform(footerScroll, [0, 1], [0, -100]); // Parallax

  return (
    <div className="bg-[#0e0a14] dark:bg-[#0e0a14] light:bg-[#f8f9fa] text-white dark:text-white light:text-[#0e0a14] min-h-screen selection:bg-[#aafc3d] selection:text-[#0e0a14] font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ══════════════════════════════════════ HEADER */}
      <Header />

      {/* ══════════════════════════════════════ HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-10 md:pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60 dark:opacity-60 light:opacity-30">
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent via-50%" />
        </div>

        <motion.div 
          style={{ y, opacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center"
        >
          <h1 className="text-4xl md:text-[52px] font-light uppercase tracking-tighter leading-none mb-4 md:mb-8 dark:text-white light:text-[#0e0a14]">
            El futuro del <br />
            <span className="text-[#aafc3d]">negocio automotor.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 dark:text-zinc-300 light:text-[#0e0a14]/60 max-w-2xl mx-auto mb-8 md:mb-10 font-light leading-relaxed">
            Marketplace exclusivo B2B, solo para profesionales verificados. <br /> 
            Sin intermediarios. Sin público final. Solo negocios reales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => { trackEvent('hero_cta_click'); setAdmissionOpen(true); }}
              className="bg-[#aafc3d] text-[#0e0a14] font-normal px-12 py-5 rounded-full hover:bg-white light:hover:bg-[#0e0a14] light:hover:text-white transition-all hover:scale-105 shadow-2xl shadow-[#aafc3d]/20 uppercase tracking-widest text-xs"
            >
              Solicitá tu acceso
            </button>
            <button 
              className="text-white dark:text-white light:text-[#0e0a14] font-normal px-8 py-5 rounded-full hover:bg-white/5 transition-all uppercase tracking-widest text-xs border border-white/10 dark:border-white/10 light:border-[#0e0a14]/10"
            >
              Ver video demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════ PROBLEMA - RESTORED FORMAT FROM "CRECIMIENTO" */}
      {/* ══════════════════════════════════════ PROBLEMA - REFACTORED */}
      <section className="py-12 md:py-24 px-4 bg-transparent dark:bg-transparent light:bg-transparent -mb-12 md:-mb-24">
        <div className="max-w-7xl mx-auto relative overflow-hidden bg-black rounded-[2rem] md:rounded-[4rem] px-6 md:px-24 pt-6 md:pt-24 pb-0 md:pb-0 shadow-[0_0_80px_rgba(0,0,0,1)]">
          {/* Top Right Corner Image Tip - MAGNIFIED AND POSITIONED CENTERED ON CORNER */}
          <div className="absolute top-0 right-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] pointer-events-none opacity-60 mix-blend-screen translate-x-1/2 -translate-y-1/2">
             <img src="/ns-img-522.png" alt="" className="w-full h-full object-contain" />
          </div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="mb-8 md:mb-24 text-center md:text-left"
            >
              <h2 className="text-3xl md:text-[52px] font-light tracking-tighter mb-4 text-white uppercase leading-none">
                Hacer negocios B2B <br /> <span className="text-[#aafc3d]">hoy es un caos.</span>
              </h2>
              <p className="text-zinc-300 font-light max-w-xl text-sm md:text-base mx-auto md:mx-0">
                 El mercado informal y los grupos de WhatsApp están matando tu rentabilidad y tiempo.
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-stretch justify-between gap-12 lg:gap-8">
              <div className="w-full lg:w-1/4 flex flex-col gap-10 pb-8 md:pb-32">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><Zap className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Ruido constante</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">Grupos de WhatsApp con 500 mensajes al día que no llevan a nada.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><CreditCard className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Falta de tiempo</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">Llamar una por una para consultar stock y precios que nunca coinciden.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><ShieldCheck className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Inseguridad total</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">Operar sin referencias de colegas verificados es un riesgo innecesario.</p>
                </motion.div>
              </div>

              {/* Hand with Cellphone (Desktop only) CHECKED IMAGE NAME - ALIGNED TO BOTTOM */}
              <div className="hidden lg:flex lg:w-2/4 justify-center items-end px-8 relative z-20">
                 <motion.img 
                  initial={{ opacity: 0, scale: 0.9, y: 50 }} 
                  whileInView={{ opacity: 1, scale: 1, y: 0 }} 
                  viewport={{ once: true }}
                  src="/celular.jpeg" 
                  alt="Reven App" 
                  className="max-w-[480px] h-auto drop-shadow-[0_0_50px_rgba(212,239,6,0.15)] translate-y-[2px]" 
                 />
              </div>

              <div className="w-full lg:w-1/4 flex flex-col gap-10 pb-8 md:pb-32">
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><Users className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Poca transparencia</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">No saber a qué valores se opera realmente el mercado mayorista.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><Fingerprint className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Capital parado</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">Autos parados 90+ días sin comprador por falta de un canal B2B ágil.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                  <div className="w-10 h-10 mb-4 text-[#aafc3d]"><FileText className="h-8 w-8" /></div>
                  <h3 className="text-white font-normal text-lg mb-2 uppercase tracking-tighter">Falta de respaldo</h3>
                  <p className="text-zinc-300 font-light text-sm leading-relaxed">Cerrar tratos de palabra sin un entorno profesional que te cuide.</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ CÓMO FUNCIONA - VIDEO PARALLAX BLUR */}
      <section ref={howItWorksRef} className="relative py-24 md:py-48 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.div style={{ filter: howBlur, y: howVideoY }} className="w-full h-full">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src={video3} type="video/mp4" />
            </video>
          </motion.div>
          <div className="absolute inset-0 bg-[#0e0a14]/60 dark:bg-[#0e0a14]/60 light:bg-white/60" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-center text-3xl md:text-5xl font-light uppercase tracking-tighter mb-12 md:mb-24 dark:text-white light:text-[#0e0a14]">Cómo funciona <span className="text-[#aafc3d]">Reven.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 backdrop-blur-sm bg-black/10 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem]">
            {[
              { s: "01", t: "APLICÁ", d: "Completás el formulario de solicitud de acceso con tu CUIT." },
              { s: "02", t: "VERIFICAMOS", d: "Auditamos que seas una concesionaria real y activa." },
              { s: "03", t: "OPERÁ", d: "Accedé al stock mayorista y empezá a cerrar negocios." }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <span className="text-6xl md:text-7xl font-light text-[#aafc3d]/20 mb-4 block leading-none">{step.s}</span>
                <h3 className="text-xl md:text-2xl font-light mb-4 dark:text-white light:text-white md:light:text-[#0e0a14]">{step.t}</h3>
                <p className="text-zinc-300 dark:text-zinc-300 light:text-white/60 md:light:text-[#0e0a14]/60 leading-relaxed font-light">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ BENEFICIOS */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-[#0e0a14] light:bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto pt-16 md:pt-32">
          <h2 className="text-center text-3xl md:text-4xl font-light uppercase tracking-tighter mb-12 md:mb-20 dark:text-white light:text-[#0e0a14]">¿Por qué <span className="text-[#aafc3d]">Reven?</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[
               { t: "Stock mayorista", d: "El catálogo más grande de Argentina exclusivo B2B." },
               { t: "Venta en días", d: "Lo que no rotás en salón, acá vuela entre colegas." },
               { t: "Red cerrada", d: "Negocios 100% seguros con colegas auditados." },
               { t: "Precios reales", d: "Sabé a cuánto se opera realmente en el mercado." },
               { t: "Adiós WhatsApp", d: "Filtros profesionales para no perder tiempo." },
               { t: "Competitividad", d: "Sumate a la red que domina el mercado B2B." }
             ].map((b, i) => (
               <div key={i} className="p-8 md:p-10 bg-white/5 dark:bg-white/5 light:bg-white rounded-[2rem] md:rounded-3xl border border-white/5 light:border-[#0e0a14]/5 hover:bg-[#aafc3d]/5 light:hover:bg-[#aafc3d]/5 transition-all shadow-sm">
                 <h4 className="text-[#aafc3d] font-light mb-3 uppercase tracking-widest text-xs">{b.t}</h4>
                 <p className="font-light text-zinc-300 dark:text-zinc-300 light:text-[#0e0a14]/60 leading-relaxed text-sm">{b.d}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ PRICING - ASFALTO BACKGROUND ENHANCED WITH PARALLAX */}
      <section ref={pricingRef} id="pricing" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <motion.div 
             style={{ y: pricingY, filter: pricingBlur, opacity: pricingOpacity }}
             className="w-full h-full"
           >
              <img src="/asfalto.jpeg" alt="Background" className="w-full h-full object-cover" />
           </motion.div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-[52px] font-light uppercase tracking-tighter mb-4 md:mb-8 leading-none dark:text-white light:text-[#0e0a14]">Invertí en tu <br /><span className="text-[#aafc3d]">mayor canal</span> de ventas.</h2>
            
            <div className="flex items-center justify-center gap-6 mt-8 md:mt-12 mb-12 md:mb-20">
              <span className={`text-xs font-bold uppercase tracking-widest ${billing === 'monthly' ? 'text-white light:text-[#0e0a14]' : 'text-white/30 light:text-[#0e0a14]/30'}`}>Mensual</span>
              <button 
                onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                className="w-14 h-7 rounded-full bg-white/10 light:bg-[#0e0a14]/10 p-1 relative"
              >
                <motion.div 
                  animate={{ x: billing === 'annual' ? 28 : 0 }}
                  className="w-5 h-5 rounded-full bg-[#aafc3d]"
                />
              </button>
              <span className={`text-xs font-bold uppercase tracking-widest ${billing === 'annual' ? 'text-white light:text-[#0e0a14]' : 'text-white/30 light:text-[#0e0a14]/30'}`}>
                Anual <span className="text-[#aafc3d] text-[10px] font-black ml-2">35% OFF</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((p, i) => (
              <div 
                key={i} 
                className={`p-10 md:p-12 rounded-[2.5rem] border flex flex-col transition-all ${p.popular ? 'bg-[#aafc3d] border-[#aafc3d] text-[#0e0a14] scale-105 shadow-2xl shadow-[#aafc3d]/20' : 'bg-white/5 dark:bg-white/5 light:bg-white border-white/5 light:border-[#0e0a14]/5 text-white dark:text-white light:text-[#0e0a14]'}`}
              >
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 opacity-60 text-center">{p.name}</h3>
                <div className="flex flex-col items-center justify-center gap-1 mb-12">
                  <div className="flex items-baseline gap-1">
                    {p.price.isFree ? (
                      <span className="text-4xl md:text-5xl font-light tracking-tighter">FREE</span>
                    ) : (
                      <>
                        <span className="text-4xl md:text-5xl font-light tracking-tighter">${(billing === 'monthly' ? p.price.monthly : p.price.annual)?.toLocaleString('es-AR')}</span>
                        <span className="text-xs font-bold opacity-60">/ {billing === 'monthly' ? 'mes' : 'año'}</span>
                      </>
                    )}
                  </div>
                  {p.price.isFree && p.freeSubtitle && (
                    <span className="text-[10px] font-light text-zinc-300 mt-1">{p.freeSubtitle}</span>
                  )}
                </div>
                <ul className="space-y-4 mb-12 flex-1">
                  {p.features.map(f => (
                    <li key={f} className={`text-sm font-light flex items-start gap-3 ${p.popular ? 'text-[#0e0a14]' : 'text-zinc-300'}`}>
                       <span className={`mt-1 h-3 w-3 rounded-full flex items-center justify-center ${p.popular ? 'bg-[#0e0a14]' : 'bg-[#aafc3d]'}`}>
                          <svg className={`w-2 h-2 ${p.popular ? 'text-[#aafc3d]' : 'text-[#0e0a14]'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                       </span>
                       {f}
                    </li>
                  ))}
                </ul>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAdmissionOpen(true)}
                  className={`w-full py-5 rounded-full font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg ${p.popular ? 'bg-[#0e0a14] text-[#aafc3d]' : 'bg-[#aafc3d] text-[#0e0a14]'}`}
                >
                  {p.cta}
                </motion.button>
              </div>
            ))}
          </div>

          <div className="mt-16 md:mt-20 text-center">
            <p className="font-light text-zinc-300 light:text-[#0e0a14] mb-12 opacity-100">💡 Un solo negocio cerrado en Reven paga la membresía de todo el año.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ FAQ - REFACTORED CONTAINER */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-[#0e0a14] light:bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto relative overflow-hidden bg-black rounded-[2rem] md:rounded-[3rem] p-6 md:p-24 shadow-[0_0_80px_rgba(0,0,0,1)]">
          {/* Bottom Left Corner Image Tip (ns-img-524) */}
          <div className="absolute bottom-0 left-0 w-[500px] md:w-[700px] h-[500px] md:h-[700px] pointer-events-none opacity-60 mix-blend-screen -translate-x-1/2 translate-y-1/2">
             <img src="/ns-img-524.png" alt="" className="w-full h-full object-contain" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-center text-3xl md:text-4xl font-light uppercase tracking-tighter mb-12 md:mb-20 text-white">Dudas <span className="text-[#aafc3d]">recurrentes.</span></h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="last:border-0 overflow-hidden">
                   <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full py-6 md:py-8 flex items-center justify-between text-left group"
                   >
                     <span className="text-base md:text-lg font-light group-hover:text-[#aafc3d] transition-colors text-zinc-300">{faq.q}</span>
                     <span className={`text-[#aafc3d] text-2xl transition-transform ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                   </button>
                   <AnimatePresence>
                     {activeFaq === i && (
                       <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="pb-6 md:pb-8 pr-12"
                        >
                          <p className="text-zinc-400 leading-relaxed font-light">{faq.a}</p>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ CTA FINAL APARCADERO */}
      <section ref={footerSectionRef} className="relative overflow-hidden pt-16 md:pt-32 bg-black">
        <div className="absolute top-0 inset-x-0 h-[100vh] z-0">
          <motion.div 
            style={{ filter: footerBlur, opacity: footerVideoOpacity, y: footerVideoY }} 
            className="w-full h-full"
          >
            <img src="/aparcadero.jpg" alt="Aparcadero" className="w-full h-full object-cover" />
          </motion.div>
          {/* Degradado negro 100% abajo a 0% a la mitad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent via-50%" />
        </div>

        <div className="relative z-10 pt-32 md:pt-40">
           <div className="text-center mb-24 md:mb-32 px-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-[52px] font-light uppercase tracking-tighter mb-8 md:mb-12 leading-none dark:text-white light:text-[#0e0a14]"
              >
                  ¿Qué esperas <br /> para sumarte?
              </motion.h2>
              <button 
                onClick={() => setAdmissionOpen(true)}
                className="bg-[#aafc3d] text-[#0e0a14] font-normal px-10 md:px-16 py-5 md:py-6 rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-[#aafc3d]/20"
              >
                  Solicitá tu acceso ahora
              </button>
           </div>
           
           <Footer 
            onAdmissionClick={() => setAdmissionOpen(true)} 
            onTermsClick={() => {}} 
            className="bg-transparent" 
           />
        </div>
      </section>

      {/* ══════════════════════════════════════ ADMISSION FORM MODAL */}
      <AnimatePresence>
        {admissionOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1a1020] p-12 md:p-16 rounded-[3rem] border border-white/5 max-w-xl w-full shadow-2xl relative">
                <button onClick={() => setAdmissionOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors text-3xl font-black">&times;</button>
                
                <h3 className="text-3xl font-normal uppercase tracking-tighter mb-4 leading-none text-white">Solicitá ingreso <span className="text-[#aafc3d]">exclusivo.</span></h3>
                <p className="text-white/40 mb-10 font-normal">Nuestro equipo validará tu agencia en 24hs hábiles.</p>
                
                <form 
                  onSubmit={(e) => { e.preventDefault(); trackEvent('form_submit'); alert("Solicitud recibida. Te contactaremos pronto."); setAdmissionOpen(false); }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <input type="text" placeholder="Nombre completo" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white" />
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="CUIT de la concesionaria" 
                        required 
                        value={cuit}
                        onChange={handleCuitChange}
                        className={`w-full bg-white/5 border ${cuitError ? 'border-red-500' : cuitStatus === 'VALID' ? 'border-[#aafc3d]' : 'border-white/10'} p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white`} 
                      />
                      {isCheckingCuit && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-t-[#aafc3d] border-white/20 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {cuitError && <p className="text-red-400 text-xs px-2">{cuitError}</p>}
                    {cuitStatus === 'VALID' && !cuitError && estadoCuit && (
                      <p className="text-[#aafc3d] text-xs px-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Razón Social encontrada. Estado: {estadoCuit}
                      </p>
                    )}

                    <input 
                      type="text" 
                      placeholder="Agencia / Concesionaria (Razón Social)" 
                      required 
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white" 
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Ciudad / Provincia" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white" />
                      <input type="tel" placeholder="WhatsApp (Cod. área + número)" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white" />
                    </div>
                    <select required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#aafc3d] transition-colors font-normal text-white/60 appearance-none">
                      <option value="" className="bg-[#1a1020]">Volumen de stock mensual</option>
                      <option value="1-5" className="bg-[#1a1020]">1 a 5 unidades</option>
                      <option value="6-20" className="bg-[#1a1020]">6 a 20 unidades</option>
                      <option value="20-50" className="bg-[#1a1020]">20 a 50 unidades</option>
                      <option value="50+" className="bg-[#1a1020]">Más de 50 unidades</option>
                    </select>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full py-6 rounded-full bg-[#aafc3d] text-[#0e0a14] font-black uppercase tracking-widest shadow-2xl shadow-[#aafc3d]/10 transition-colors"
                  >
                    Enviar solicitud de acceso
                  </motion.button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
