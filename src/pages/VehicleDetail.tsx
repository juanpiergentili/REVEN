
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Share2, 
  Heart, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  CheckCircle2, 
  MessageSquare, 
  Eye, 
  Clock,
  ShieldCheck,
  Zap,
  Star,
  Users,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

// Mock data - In a real app, this would come from an API/Firestore
const MOCK_VEHICLES = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Hilux',
    version: '2.8 SRX 4X4 AT',
    year: 2023,
    km: 15000,
    fuelType: 'DIESEL',
    condition: 'USADO',
    location: 'San Isidro, GBA',
    price: 48500,
    currency: 'USD',
    photos: [
      'https://images.unsplash.com/photo-1618341641711-203204969f52?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1590362891175-3794ec1693af?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1606577924006-27d39b132ee6?auto=format&fit=crop&q=80&w=1200',
    ],
    description: 'Impecable estado, único dueño. Service oficiales al día. Cubiertas nuevas. Lista para transferir.',
    createdAt: '2024-03-10T10:00:00Z',
    views: 1240,
    isInspected: true,
    sellerName: 'Concesionaria Norte',
    sellerDealer: 'Norte Automotores S.A.'
  },
  {
    id: '2',
    brand: 'Volkswagen',
    model: 'Amarok',
    version: 'V6 Extreme 4x4',
    year: 2024,
    km: 0,
    fuelType: 'DIESEL',
    condition: '0KM',
    location: 'Palermo, CABA',
    price: 58500,
    currency: 'USD',
    photos: [
      'https://images.unsplash.com/photo-1606577924006-27d39b132ee6?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
    ],
    description: 'Entrega inmediata. Varios colores disponibles. Garantía de fábrica.',
    createdAt: '2024-03-12T10:00:00Z',
    views: 850,
    isInspected: true,
    sellerName: 'Sport Cars',
    sellerDealer: 'Sport Cars S.A.'
  },
  {
    id: '3',
    brand: 'Fiat',
    model: 'Cronos',
    version: 'Precision 1.3 GSE',
    year: 2023,
    km: 12000,
    fuelType: 'NAFTA',
    condition: 'USADO',
    location: 'Pilar, GBA',
    price: 16500000,
    currency: 'ARS',
    photos: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200',
    ],
    description: 'El más vendido del país. Excelente estado, service al día.',
    createdAt: '2024-03-11T10:00:00Z',
    views: 2100,
    isInspected: false,
    sellerName: 'Auto Premium',
    sellerDealer: 'Auto Premium S.A.'
  }
];

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);
  
  // Find vehicle by ID or fallback to first one for demo
  const vehicle = MOCK_VEHICLES.find(v => v.id === id) || MOCK_VEHICLES[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-4 md:px-8 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Gallery & Description */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery */}
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-[16/9] rounded-[3rem] overflow-hidden border border-border/50 shadow-2xl"
              >
                <img 
                  src={vehicle.photos[activePhoto]} 
                  alt={vehicle.model} 
                  className="w-full h-full object-cover transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-full shadow-xl shadow-primary/20">
                    {vehicle.condition}
                  </Badge>
                  {vehicle.isInspected && (
                    <Badge className="bg-blue-500 text-white font-bold px-4 py-1.5 rounded-full shadow-xl shadow-blue-500/20 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      PERITADO
                    </Badge>
                  )}
                </div>
              </motion.div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {vehicle.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      activePhoto === i ? 'border-primary scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="p-10 rounded-[3rem] bg-card/30 border border-border/50 space-y-6">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">Descripción</h2>
              <p className="text-muted-foreground font-medium leading-relaxed text-lg">
                {vehicle.description}
              </p>
              <Separator className="bg-border/50" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Publicado</p>
                  <p className="font-bold text-sm">{formatDate(vehicle.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visitas</p>
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-primary" />
                    {vehicle.views.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</p>
                  <p className="font-bold text-sm">#{vehicle.id.padStart(6, '0')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ubicación</p>
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {vehicle.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Contact */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
              {/* Main Info Card */}
              <div className="p-10 rounded-[3rem] bg-card/50 border border-border/50 shadow-2xl space-y-8">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">
                    {vehicle.brand} <br />
                    <span className="text-primary">{vehicle.model}</span>
                  </h1>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    {vehicle.version}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-5xl font-bold tracking-tighter text-primary">
                    {vehicle.currency} {vehicle.price.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">PRECIO MAYORISTA B2B</p>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{vehicle.year}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{vehicle.km.toLocaleString()} KM</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <Fuel className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{vehicle.fuelType}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">VERIFICADO</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 group uppercase tracking-tighter"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="mr-2 h-6 w-6" />
                  CONTACTAR VENDEDOR
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Seller Info */}
              <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendedor</p>
                  <h4 className="font-bold text-lg uppercase tracking-tighter">{vehicle.sellerName}</h4>
                  <p className="text-xs font-medium text-primary">{vehicle.sellerDealer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
