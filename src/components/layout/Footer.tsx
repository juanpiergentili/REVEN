import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Building2, MessageCircle, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onAdmissionClick: () => void;
  onTermsClick: () => void;
}

export function Footer({ onAdmissionClick, onTermsClick }: FooterProps) {
  return (
    <footer className="bg-foreground text-white dark:bg-muted/20 dark:text-foreground py-24 border-t border-border/10 transition-colors duration-300">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          <div className="col-span-1 md:col-span-1 space-y-6 flex flex-col items-center md:items-start">
            <Logo variant="footer" className="text-4xl" />
            <p className="text-white/70 text-sm font-medium leading-relaxed max-w-xs">
              La red B2B más exclusiva de Argentina. Conectamos profesionales del sector automotor con tecnología y transparencia.
            </p>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/70">
              <MapPin className="h-4 w-4 text-primary" />
              Córdoba, Argentina
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-primary">Plataforma</h4>
            <ul className="space-y-4 text-sm font-medium text-white/70">
              <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Ingresar</Link></li>
              <li><button onClick={onAdmissionClick} className="hover:text-primary transition-colors">Admisión</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-primary">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-white/70">
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Bases y Condiciones</button></li>
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Privacidad</button></li>
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Cookies</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-primary">Contacto</h4>
            <ul className="space-y-4 text-sm font-medium text-white/70">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                hola@reven.com.ar
              </li>
              <li className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-primary" />
                Córdoba, Argentina
              </li>
              <li className="flex items-center gap-3">
                <a
                  href="https://wa.me/543516161300?text=Hola,%20vi%20su%20servicio%20para%20concesionarias%20de%20REVEN%20y%20me%20gustaria%20sacarme%20algunas%20dudas.%20Mi%20nombre%20es..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            © {new Date().getFullYear()} REVEN B2B. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            <ShieldCheck className="h-4 w-4" />
            ENTORNO 100% SEGURO
          </div>
        </div>
      </div>
    </footer>
  );
}
