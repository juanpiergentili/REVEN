import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Building2, MessageCircle, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onAdmissionClick: () => void;
  onTermsClick: () => void;
  className?: string;
}

export function Footer({ onAdmissionClick, onTermsClick, className = "bg-[#0e0a14]" }: FooterProps) {
  return (
    <footer className={`${className} text-white py-24 pb-0 relative overflow-hidden transition-colors duration-300 font-['Inter',sans-serif]`}>
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-8">
             <div className="flex items-center gap-3">
               <Logo className="text-3xl" variant="footer" />
             </div>
             <p className="text-[#ffffff] text-base font-light leading-relaxed max-w-sm">
               La plataforma privada de trading automotor más avanzada de Argentina. Exclusividad, tecnología y resultados reales.
             </p>
             <div className="flex gap-4">
               {[Instagram, Facebook, Linkedin, Youtube].map((Icon, i) => (
                 <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#ffffff] hover:border-[#aafc3d]/50 hover:text-[#aafc3d] transition-all">
                   <Icon size={18} />
                 </a>
               ))}
             </div>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-light uppercase tracking-[0.3em] mb-8 text-[#aafc3d]">Plataforma</h4>
            <ul className="space-y-4 text-sm font-light uppercase tracking-widest text-[#ffffff]">
              <li><Link to="/" className="hover:text-[#aafc3d] transition-colors">Inicio</Link></li>
              <li><Link to="/marketplace" className="hover:text-[#aafc3d] transition-colors">Marketplace</Link></li>
              <li><Link to="/login" className="hover:text-[#aafc3d] transition-colors">Ingresar</Link></li>
              <li><button onClick={onAdmissionClick} className="hover:text-[#aafc3d] transition-colors">Admisión</button></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-light uppercase tracking-[0.3em] mb-8 text-[#aafc3d]">Legal</h4>
            <ul className="space-y-4 text-sm font-light uppercase tracking-widest text-[#ffffff]">
              <li><button onClick={onTermsClick} className="hover:text-[#aafc3d] transition-colors">Bases y Condiciones</button></li>
              <li><button onClick={onTermsClick} className="hover:text-[#aafc3d] transition-colors">Privacidad</button></li>
              <li><button onClick={onTermsClick} className="hover:text-[#aafc3d] transition-colors">Cookies</button></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="md:col-span-4">
            <h4 className="text-[10px] font-light uppercase tracking-[0.3em] mb-8 text-[#aafc3d]">Contacto</h4>
            <ul className="space-y-6 text-sm font-light text-[#ffffff] uppercase tracking-widest">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#aafc3d]">
                  <Mail size={18} />
                </div>
                <span>hola@reven.com.ar</span>
              </li>
              <li className="flex items-center gap-4 text-[#ffffff]">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#aafc3d]">
                  <Building2 size={18} />
                </div>
                <span>Córdoba, Argentina</span>
              </li>
              <li>
                <a
                  href="https://wa.me/5493515999338"
                  target="_blank"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#aafc3d] group-hover:scale-110 transition-transform">
                    <MessageCircle size={18} />
                  </div>
                  <span className="group-hover:text-white transition-colors">WhatsApp Soporte</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-6 pt-12 pb-12 text-[10px] font-light uppercase tracking-[0.3em] text-white/20">
            <p>© {new Date().getFullYear()} REVEN B2B MULTIPLATFORM. TODOS LOS DERECHOS RESERVADOS.</p>
            <div className="flex gap-12">
              <span className="hover:text-white transition-colors cursor-pointer">SOPORTE TÉCNICO</span>
              <span className="hover:text-white transition-colors cursor-pointer">SLA ACARA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-[#aafc3d]/5 blur-[120px] -z-0 rounded-full" />
    </footer>
  );
}
