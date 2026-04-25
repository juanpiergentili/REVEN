import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft, Share2, MapPin, Calendar, Gauge, Fuel,
  CheckCircle2, MessageSquare, Eye, ShieldCheck, Users, ArrowRight, Car, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import type { Vehicle } from '@/src/types';

import { MOCK_VEHICLES_FALLBACK } from '@/src/data/mock-vehicles';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }

    async function fetchVehicle() {
      try {
        const snap = await getDoc(doc(db, 'vehicles', id));
        if (snap.exists()) {
          const data = snap.data();
          setVehicle({ ...data, id: snap.id } as Vehicle);
          updateDoc(snap.ref, { viewCount: increment(1) }).catch(() => {});
          setLoading(false);
          return;
        }

        // Fallback to MOCK data
        const mockVehicle = MOCK_VEHICLES_FALLBACK.find(v => v.id === id);
        if (mockVehicle) {
          setVehicle(mockVehicle);
          setLoading(false);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        // Even if Firestore fails, try mock
        const mockVehicle = MOCK_VEHICLES_FALLBACK.find(v => v.id === id);
        if (mockVehicle) {
          setVehicle(mockVehicle);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
    } catch {
      return 'Reciente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="font-bold uppercase tracking-widest text-xs">Cargando vehículo...</span>
      </div>
    );
  }

  if (notFound || !vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Car className="h-20 w-20 text-muted-foreground/20" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Vehículo no encontrado</h2>
          <p className="text-muted-foreground font-medium">Esta publicación no existe o fue eliminada.</p>
        </div>
        <Button onClick={() => navigate('/marketplace')} className="rounded-full font-bold uppercase tracking-widest text-xs">
          Volver al Marketplace
        </Button>
      </div>
    );
  }

  const photos = vehicle.photos?.length > 0 ? vehicle.photos : [];
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Volver
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Gallery & Description */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-[16/9] rounded-[3rem] overflow-hidden border border-border/50 shadow-2xl bg-white/5"
              >
                {hasPhotos ? (
                  <img
                    src={photos[activePhoto]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Car className="h-20 w-20 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Sin fotografías</p>
                  </div>
                )}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-full shadow-xl shadow-primary/20">
                    {vehicle.condition}
                  </Badge>
                  {vehicle.isInspected && (
                    <Badge className="bg-blue-500 text-white font-bold px-4 py-1.5 rounded-full shadow-xl shadow-blue-500/20 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> PERITADO
                    </Badge>
                  )}
                </div>
              </motion.div>

              {hasPhotos && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                        activePhoto === i ? 'border-primary scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="p-10 rounded-[3rem] bg-card/30 border border-border/50 space-y-6">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">Descripción</h2>
              <p className="text-muted-foreground font-medium leading-relaxed text-lg">
                {vehicle.description || 'Sin descripción disponible.'}
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
                    {(vehicle.viewCount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</p>
                  <p className="font-bold text-sm">#{id?.slice(-6).toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ubicación</p>
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {vehicle.location || '—'}
                  </p>
                </div>
              </div>

              {/* Doc badges */}
              {(vehicle.hasVTV || vehicle.hasPatenteAlDay || vehicle.gncObleaVigente) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {vehicle.hasVTV && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> VTV Vigente
                    </Badge>
                  )}
                  {vehicle.hasPatenteAlDay && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> Patente al día
                    </Badge>
                  )}
                  {vehicle.gncObleaVigente && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> GNC Vigente
                    </Badge>
                  )}
                </div>
              )}
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
                  {vehicle.version && (
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">{vehicle.version}</p>
                  )}
                </div>

                {vehicle.price != null && (
                  <div className="space-y-1">
                    <p className="text-5xl font-bold tracking-tighter text-primary">
                      {vehicle.currency} {vehicle.price.toLocaleString('es-AR')}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">PRECIO MAYORISTA B2B</p>
                  </div>
                )}

                <Separator className="bg-border/50" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{vehicle.year}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border border-border/50 flex flex-col items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{vehicle.km.toLocaleString('es-AR')} KM</span>
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
                  onClick={() => navigate(
                    `/messages?userId=${vehicle.sellerId}&userName=${encodeURIComponent(vehicle.sellerName)}&company=${encodeURIComponent(vehicle.sellerName)}&vehicleId=${vehicle.id}`
                  )}
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
                  <p className="text-xs font-medium text-primary">Miembro REVEN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
