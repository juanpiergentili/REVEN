import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onAdmissionClick: () => void;
  onTermsClick: () => void;
}

export function Footer({ onAdmissionClick, onTermsClick }: FooterProps) {
  return (
    <footer className="bg-[#0a0a0a] text-white py-20 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-5">
            <Logo variant="footer" className="text-3xl" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider leading-relaxed max-w-[220px]">
              La plataforma privada de trading automotor más avanzada de Argentina. Exclusividad, tecnología y resultados reales.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-primary">Plataforma</h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-white/40">
              <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Ingresar</Link></li>
              <li><button onClick={onAdmissionClick} className="hover:text-primary transition-colors">Admisión</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-primary">Legal</h4>
            <ul className="space-y-3 text-xs font-bold uppercase tracking-widest text-white/40">
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Bases y Condiciones</button></li>
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Privacidad</button></li>
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors">Cookies</button></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-primary">Contacto</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                info@reven.com.ar
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                Córdoba, Argentina
              </li>
              <li>
                <a
                  href="https://wa.me/543516161300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  WhatsApp Soporte
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            © {new Date().getFullYear()} REVEN B2B. Todos los derechos reservados.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Entorno 100% seguro y exclusivo B2B
          </p>
        </div>
      </div>
    </footer>
  );
}
