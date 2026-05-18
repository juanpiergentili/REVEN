import React, { useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim() || !inquiry.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');

    const formattedMessage = `¡Hola Soporte REVEN! 👋
Mi nombre es *${name.trim()}*, de la concesionaria *${company.trim()}*.

Mi consulta es:
${inquiry.trim()}`;

    const whatsappUrl = `https://wa.me/5493515999338?text=${encodeURIComponent(formattedMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    // Reset state & close widget
    setName('');
    setCompany('');
    setInquiry('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-300 group relative cursor-pointer"
          aria-label="Contactar por WhatsApp"
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
          </span>
          
          <svg
            className="h-7 w-7 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.507.003 9.924-4.386 9.927-9.794.002-2.62-1.02-5.086-2.879-6.945-1.859-1.86-4.33-2.883-6.963-2.884-5.512 0-9.93 4.385-9.933 9.798-.001 1.77.493 3.3 1.42 4.654l-.993 3.63 3.797-.989zM18.06 14.88c-.328-.164-1.944-.96-2.246-1.07-.302-.11-.522-.164-.741.164-.219.329-.85 1.07-1.041 1.289-.192.219-.384.246-.712.082-1.399-.701-2.42-1.223-3.394-2.89-.258-.443-.09-.672.072-.832.146-.145.328-.383.493-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.741-1.785-1.014-2.443-.266-.641-.56-.543-.767-.543-.198-.001-.424-.002-.65-.002-.226 0-.594.085-.904.425-.31.339-1.183 1.157-1.183 2.82 0 1.664 1.21 3.272 1.375 3.492.164.22 2.384 3.642 5.777 5.101.807.347 1.437.554 1.93.711.81.257 1.547.22 2.128.134.647-.096 1.944-.795 2.219-1.562.274-.767.274-1.425.192-1.562-.082-.137-.301-.22-.63-.383z" />
          </svg>
          
          {/* Tooltip */}
          <span className="absolute right-16 bg-[#1a1a1a] border border-border text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl">
            ¿Dudas? Escríbenos por WhatsApp
          </span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="w-[330px] rounded-2xl bg-card border border-border overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#075e54] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center font-black text-sm border-2 border-white/20">
                  RV
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#075e54]"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-white leading-tight">Soporte REVEN</h3>
                <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest">En línea — Respuesta inmediata</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Chat Body simulating conversation */}
          <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto bg-[#efeae2] dark:bg-zinc-950/40 relative">
            {/* Background pattern overlay (simulated) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 space-y-3">
              {/* Message 1 */}
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 rounded-2xl rounded-bl-none shadow-sm text-xs leading-relaxed">
                  <p>¡Hola! 👋 Bienvenido a la comunidad REVEN B2B.</p>
                  <p className="mt-1">¿En qué te podemos ayudar hoy?</p>
                </div>
              </div>

              {/* Message 2 */}
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 rounded-2xl rounded-bl-none shadow-sm text-xs leading-relaxed">
                  Por favor, completa tus datos en el formulario para iniciar la conversación instantánea en WhatsApp con nuestro equipo comercial:
                </div>
              </div>

              {/* Form inside chat */}
              <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-border p-4 rounded-2xl shadow-md space-y-3 animate-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Nombre y Apellido</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Nombre de tu Concesionaria</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ejemplo Autos S.A."
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Tu Consulta</label>
                  <textarea
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    placeholder="Escribe tu duda aquí..."
                    rows={2}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/50"
                    required
                  ></textarea>
                </div>

                {error && (
                  <p className="text-[10px] font-bold text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Iniciar Conversación
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
