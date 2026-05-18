import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  UploadCloud, 
  Search, 
  Car, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  Camera,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function HowItWorks() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Centro de Ayuda REVEN</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              Cómo <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Funciona</span>
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
              Tu guía paso a paso para dominar la plataforma B2B más exclusiva del mercado automotor.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-6 space-y-32">
        
        {/* Section 1: Registro */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">1. Crea tu cuenta</h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              El proceso de registro es rápido pero exclusivo. REVEN está diseñado para concesionarias y profesionales del rubro verificados.
            </p>
            <ul className="space-y-4">
              {[
                "Haz clic en 'Ingresar' o 'Registrarse' en el menú superior.",
                "Completa tus datos profesionales y los de tu concesionaria.",
                "Nuestro equipo verificará tu perfil para mantener la exclusividad de la red."
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{step}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate('/?register=true')} className="mt-8 rounded-full font-bold uppercase tracking-widest text-xs px-8 h-12">
              Registrarme Ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {/* Mockup visual de Registro */}
          <div className="relative rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm p-8 shadow-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-2xl -z-10 rounded-3xl"></div>
            <div className="space-y-4">
              <div className="h-8 w-1/3 bg-white/5 rounded-lg mb-6"></div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="pt-4">
                <div className="h-12 w-full bg-primary/80 rounded-2xl flex items-center justify-center">
                  <div className="h-4 w-1/3 bg-white/40 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Publicar */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          {/* Mockup visual de Publicar */}
          <div className="relative rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm p-8 shadow-2xl order-2 md:order-1">
            <div className="absolute -inset-1 bg-gradient-to-l from-primary/20 to-transparent blur-2xl -z-10 rounded-3xl"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-32 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-col gap-2">
                <Camera className="h-8 w-8 text-muted-foreground/50" />
                <div className="h-2 w-1/2 bg-white/10 rounded"></div>
              </div>
              <div className="h-32 rounded-2xl bg-white/5 border border-white/5"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div className="h-3 w-1/3 bg-white/10 rounded"></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="h-3 w-1/4 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">2. Publica un Vehículo</h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              Nuestro sistema de publicación está optimizado para que subas tu stock en menos de 2 minutos.
            </p>
            <ul className="space-y-4">
              {[
                "Presiona el botón 'Publicar Unidad' en el menú superior.",
                "Selecciona el año, marca y modelo. El sistema autocompletará las versiones.",
                "Sube hasta 10 fotos de alta calidad.",
                "Fija el precio (puedes elegir mostrarlo en USD o ARS)."
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{step}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate('/publish')} variant="outline" className="mt-8 rounded-full font-bold uppercase tracking-widest text-xs px-8 h-12">
              Ir a Publicar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.section>

        {/* Section 3: Navegación */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">3. Navega y Conecta</h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">
              REVEN está diseñado para facilitar los negocios B2B. Encuentra lo que buscas y contacta al vendedor directamente.
            </p>
            <ul className="space-y-4">
              {[
                "Usa el Marketplace para filtrar por marca, año y rango de precios.",
                "Explora el directorio de Agencias para conocer a tus colegas.",
                "Haz clic en el botón de chat en cualquier vehículo para enviar un mensaje directo al vendedor.",
                "Gestiona tu propio perfil y stock desde 'Mi Concesionaria'."
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{step}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate('/marketplace')} className="mt-8 rounded-full font-bold uppercase tracking-widest text-xs px-8 h-12">
              Explorar Marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mockup visual de Marketplace */}
          <div className="relative rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm p-8 shadow-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-2xl -z-10 rounded-3xl"></div>
            <div className="flex gap-4 mb-6">
              <div className="h-10 w-full bg-white/5 rounded-full border border-white/5 flex items-center px-4">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="h-2 w-1/3 bg-white/10 rounded"></div>
              </div>
              <div className="h-10 w-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <div className="h-4 w-4 bg-primary/50 rounded-sm"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                  <div className="h-24 bg-white/5"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                    <div className="h-2 w-1/2 bg-white/5 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
