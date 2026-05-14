import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Share2, MapPin, Calendar, Gauge, Fuel,
  CheckCircle2, MessageSquare, Eye, ShieldCheck, Users, ArrowRight, Car, Loader2,
  AlertCircle, Wrench, PaintBucket, Settings, X, Expand,
  Pencil, Pause, Play, CheckSquare, Trash2, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db, useAuth } from '@/src/lib/firebase';
import type { Vehicle } from '@/src/types';
import { extractIdFromSlug } from '@/src/lib/seo';
import { addPointsToAgency } from '@/src/lib/gamification';
import { convertTimestamp } from '@/src/lib/firebase';


export function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ownerActionLoading, setOwnerActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [soldViaReven, setSoldViaReven] = useState<boolean | null>(null);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencies, setAgencies] = useState<{ id: string; company: string; name: string }[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<{ id: string; company: string } | null>(null);

  const id = slug ? extractIdFromSlug(slug) : undefined;

  useEffect(() => {
    // Reset state when ID or slug changes to avoid showing stale data
    setVehicle(null);
    setLoading(true);
    setNotFound(false);

    if (!id) {
      console.warn('[VehicleDetail] No valid ID extracted from slug:', slug);
      setNotFound(true);
      setLoading(false);
      return;
    }

    console.log(`[VehicleDetail] Attempting to fetch vehicle. ID: "${id}", Slug: "${slug}"`);

    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.error('[VehicleDetail] Fetch timeout (10s) for ID:', id);
        setLoading(false);
        setNotFound(true);
      }
    }, 10000);

    async function fetchVehicle() {
      const id = extractIdFromSlug(slug || '');
      console.log('[VehicleDetail] Extracted ID:', id, 'from slug:', slug);

      if (!id) {
        console.warn('[VehicleDetail] No valid ID extracted from slug');
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'vehicles', id));
        if (!isMounted) return;

        if (snap.exists()) {
          const data = snap.data();
          console.log('[VehicleDetail] Document found successfully:', data.brand, data.model);
          setVehicle({
            ...data,
            id: snap.id,
            createdAt: convertTimestamp(data.createdAt)
          } as Vehicle);
          
          // Background update: don't wait for this
          updateDoc(snap.ref, { viewCount: increment(1) }).catch(e => {
            console.warn('[VehicleDetail] Failed to increment viewCount:', e);
          });
          
          setLoading(false);
        } else {
          console.warn(`[VehicleDetail] Document does not exist in Firestore. ID: "${id}"`);
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('[VehicleDetail] Critical error during fetch:', err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    fetchVehicle();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [id, slug]);

  const isOwner = !!user && !!vehicle && vehicle.sellerId === user.uid;

  const handleStatusChange = async (status: Vehicle['status']) => {
    if (!vehicle || !user) return;
    setOwnerActionLoading(true);
    try {
      const update: any = { status };
      const wasRevenSold = status === 'ACTIVE' && (vehicle as any).soldViaReven && (vehicle as any).buyerAgencyId;
      if (wasRevenSold) {
        update.soldViaReven = null;
        update.buyerAgencyId = null;
        update.buyerAgencyName = null;
        update.soldAt = null;
      }
      // Update vehicle first — if this fails, no points are reversed
      await updateDoc(doc(db, 'vehicles', vehicle.id), update);
      setVehicle(v => v ? { ...v, ...update } : v);
      // Deduct points after confirming vehicle update succeeded
      if (wasRevenSold) {
        await Promise.all([
          addPointsToAgency(user.uid, -50),
          addPointsToAgency((vehicle as any).buyerAgencyId, -50),
        ]);
      }
    } finally {
      setOwnerActionLoading(false);
    }
  };

  const openSoldDialog = async () => {
    setSoldViaReven(null);
    setSelectedBuyer(null);
    setAgencySearch('');
    setSoldDialogOpen(true);
    const snap = await getDocs(collection(db, 'users'));
    const list = snap.docs
      .filter(d => d.id !== user?.uid && d.data().status === 'active' && d.data().role !== 'ADMIN')
      .map(d => ({ id: d.id, company: d.data().company || d.data().name || 'Agencia', name: d.data().name || '' }));
    setAgencies(list);
  };

  const confirmSold = async () => {
    if (!vehicle || !user) return;
    setOwnerActionLoading(true);
    try {
      const update: any = { status: 'SOLD', soldAt: serverTimestamp() };
      if (soldViaReven && selectedBuyer) {
        update.soldViaReven = true;
        update.buyerAgencyId = selectedBuyer.id;
        update.buyerAgencyName = selectedBuyer.company;
      }
      // Mark vehicle as sold first — if this fails, no points are awarded
      await updateDoc(doc(db, 'vehicles', vehicle.id), update);
      setVehicle(v => v ? { ...v, status: 'SOLD', ...update } : v);
      setSoldDialogOpen(false);
      // Award points after confirming vehicle update succeeded
      if (soldViaReven && selectedBuyer) {
        await Promise.all([
          addPointsToAgency(user.uid, 50),
          addPointsToAgency(selectedBuyer.id, 50),
        ]);
      }
    } finally {
      setOwnerActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setOwnerActionLoading(true);
    try {
      await deleteDoc(doc(db, 'vehicles', vehicle.id));
      navigate('/marketplace');
    } finally {
      setOwnerActionLoading(false);
      setConfirmDelete(false);
    }
  };

  const photos = vehicle?.photos?.length > 0 ? vehicle.photos : [];
  const hasPhotos = photos.length > 0;

  const prev = useCallback(() =>
    setActivePhoto(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() =>
    setActivePhoto(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, prev, next]);

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
            <Button
              variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              onClick={() => {
                const text = `¡Mira este vehículo en REVEN! ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n\n${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:text-primary hover:bg-primary/10 transition-colors"
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
                className="relative aspect-[16/9] rounded-[3rem] overflow-hidden border border-border/50 shadow-2xl bg-muted group"
              >
                {hasPhotos ? (
                  <>
                    <img
                      src={photos[activePhoto]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover transition-all duration-700 cursor-zoom-in"
                      onClick={() => setLightboxOpen(true)}
                    />
                    {/* Expand hint */}
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Expand className="h-4 w-4" />
                    </button>
                    {/* Prev / Next arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={prev}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={next}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                        {/* Dot indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActivePhoto(i)}
                              className={`rounded-full transition-all ${i === activePhoto ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Car className="h-20 w-20 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Sin fotografías</p>
                  </div>
                )}
                <div className="absolute top-6 left-6 flex gap-2 pointer-events-none">
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
                      onClick={() => { setActivePhoto(i); }}
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

            {/* Lightbox */}
            <AnimatePresence>
              {lightboxOpen && hasPhotos && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                  onClick={() => setLightboxOpen(false)}
                >
                  {/* Close */}
                  <button
                    className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
                    onClick={() => setLightboxOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>

                  {/* Counter */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 font-bold text-xs uppercase tracking-widest">
                    {activePhoto + 1} / {photos.length}
                  </div>

                  {/* Image */}
                  <motion.img
                    key={activePhoto}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={photos[activePhoto]}
                    alt={`${vehicle.brand} ${vehicle.model} ${activePhoto + 1}`}
                    className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all"
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); next(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all"
                      >
                        <ChevronRight className="h-8 w-8" />
                      </button>
                    </>
                  )}

                  {/* Thumbnail strip */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-[90vw]">
                      {photos.map((photo, i) => (
                        <button
                          key={i}
                          onClick={e => { e.stopPropagation(); setActivePhoto(i); }}
                          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                            i === activePhoto ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'
                          }`}
                        >
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
              {(vehicle.hasVTV || vehicle.gncObleaVigente || vehicle.verificacionPolicial || vehicle.garantiaFabrica) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {vehicle.hasVTV && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> VTV Vigente
                    </Badge>
                  )}
                  {vehicle.verificacionPolicial && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> Verificación Policial
                    </Badge>
                  )}
                  {vehicle.garantiaFabrica && (
                    <Badge variant="outline" className="rounded-full border-green-500/30 text-green-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> Garantía de Fábrica
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

            {/* Estado Técnico / Peritaje */}
            {vehicle.inspectionData && (
              <div className="p-10 rounded-[3rem] bg-card/30 border border-border/50 space-y-6">
                <h2 className="text-2xl font-bold tracking-tighter uppercase">Estado Técnico</h2>

                {/* Sin Gastos */}
                {vehicle.inspectionData.sinGastos && (
                  <div className="flex items-center gap-3 p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-black text-sm uppercase tracking-widest text-green-500">Sin gastos</p>
                      <p className="text-xs text-muted-foreground font-medium">El vehículo no tiene ningún detalle ni gasto pendiente</p>
                    </div>
                  </div>
                )}

                {/* Observaciones Internas */}
                {vehicle.inspectionData.observacionesInternas?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observaciones Internas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.inspectionData.observacionesInternas.map((obs: string) => (
                        <Badge key={obs} variant="outline" className="rounded-full border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          {obs}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cubiertas */}
                {(vehicle.inspectionData.cubiertas?.cambiar > 0 || vehicle.inspectionData.cubiertas?.sinAuxilio) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cubiertas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.inspectionData.cubiertas.cambiar > 0 && (
                        <Badge variant="outline" className="rounded-full border-blue-500/30 text-blue-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          Cambiar {vehicle.inspectionData.cubiertas.cambiar} cubierta{vehicle.inspectionData.cubiertas.cambiar > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {vehicle.inspectionData.cubiertas.sinAuxilio && (
                        <Badge variant="outline" className="rounded-full border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          Sin rueda de auxilio
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Chapa y Pintura */}
                {vehicle.inspectionData.chapaPintura?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PaintBucket className="h-4 w-4 text-purple-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chapa y Pintura</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.inspectionData.chapaPintura.map((c: any) => (
                        <Badge key={`${c.panel}-${c.tipo}`} variant="outline" className="rounded-full border-purple-500/30 text-purple-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          {c.panel}: {c.tipo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ópticas */}
                {vehicle.inspectionData.opticasDanadas?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-cyan-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ópticas Dañadas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.inspectionData.opticasDanadas.map((o: string) => (
                        <Badge key={o} variant="outline" className="rounded-full border-cyan-500/30 text-cyan-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado Mecánico */}
                {vehicle.inspectionData.fallasMecanicas?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fallas Mecánicas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.inspectionData.fallasMecanicas.map((f: string) => (
                        <Badge key={f} variant="outline" className="rounded-full border-red-500/30 text-red-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {vehicle.inspectionData.observacionesNotas && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notas adicionales</p>
                    <p className="text-sm text-muted-foreground font-medium">{vehicle.inspectionData.observacionesNotas}</p>
                  </div>
                )}
              </div>
            )}
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

                {isOwner ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Tu publicación</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2"
                        onClick={() => navigate(`/publish?edit=${vehicle.id}`)}
                        disabled={ownerActionLoading}
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </Button>
                      {vehicle.status === 'ACTIVE' ? (
                        <Button
                          variant="outline"
                          className="h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2"
                          onClick={() => handleStatusChange('PAUSED')}
                          disabled={ownerActionLoading}
                        >
                          <Pause className="h-4 w-4" /> Pausar
                        </Button>
                      ) : vehicle.status === 'PAUSED' ? (
                        <Button
                          variant="outline"
                          className="h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2 text-primary border-primary/40"
                          onClick={() => handleStatusChange('ACTIVE')}
                          disabled={ownerActionLoading}
                        >
                          <Play className="h-4 w-4" /> Activar
                        </Button>
                      ) : vehicle.status === 'SOLD' ? (
                        <Button
                          variant="outline"
                          className="h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2 text-primary border-primary/40"
                          onClick={() => handleStatusChange('ACTIVE')}
                          disabled={ownerActionLoading}
                        >
                          <Play className="h-4 w-4" /> Reactivar
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        className={`h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2 ${
                          vehicle.status === 'SOLD'
                            ? (vehicle as any).soldViaReven
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted border-border text-muted-foreground'
                            : 'text-primary border-primary/40'
                        }`}
                        onClick={vehicle.status !== 'SOLD' ? openSoldDialog : undefined}
                        disabled={ownerActionLoading || vehicle.status === 'SOLD'}
                      >
                        <CheckSquare className="h-4 w-4" />
                        {vehicle.status === 'SOLD'
                          ? (vehicle as any).soldViaReven ? 'Vendida REVEN ✓' : 'Vendida'
                          : 'Marcar vendida'}
                      </Button>
                      <Button
                        variant="outline"
                        className={`h-12 rounded-2xl font-bold uppercase tracking-tighter text-xs gap-2 ${confirmDelete ? 'bg-red-500/10 border-red-500 text-red-500' : 'text-red-400 border-red-400/30'}`}
                        onClick={handleDelete}
                        disabled={ownerActionLoading}
                      >
                        <Trash2 className="h-4 w-4" /> {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 group uppercase tracking-tighter"
                    onClick={() => navigate(
                      `/messages?userId=${vehicle.sellerId}&userName=${encodeURIComponent(vehicle.sellerName)}&company=${encodeURIComponent(vehicle.sellerCompany || vehicle.sellerName)}&vehicleId=${vehicle.id}${vehicle.sellerAvatarUrl ? `&logo=${encodeURIComponent(vehicle.sellerAvatarUrl)}` : ''}`
                    )}
                  >
                    <MessageSquare className="mr-2 h-6 w-6" />
                    CONTACTAR VENDEDOR
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>

              {/* Seller Info */}
              <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                  {vehicle.sellerAvatarUrl && <AvatarImage src={vehicle.sellerAvatarUrl} alt={vehicle.sellerName} className="object-cover" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {(vehicle.sellerName || vehicle.sellerCompany || '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
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

      {/* Sold Dialog */}
      <Dialog open={soldDialogOpen} onOpenChange={open => { setSoldDialogOpen(open); if (!open) { setSoldViaReven(null); setSelectedBuyer(null); } }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tighter text-xl">Marcar como vendida</DialogTitle>
          </DialogHeader>

          {soldViaReven === null ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground font-medium">¿Cómo realizaste la venta?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setSoldViaReven(true)}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tighter text-sm text-primary">A través de REVEN</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">+50 puntos para vos y el comprador</p>
                  </div>
                </button>
                <button
                  onClick={() => { setSoldViaReven(false); confirmSold(); }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tighter text-sm">Por mi cuenta</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Sin puntos de gamificación</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground font-medium">Seleccioná la agencia compradora</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agencia..."
                  className="pl-10 rounded-2xl"
                  value={agencySearch}
                  onChange={e => setAgencySearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {agencies
                  .filter(a => a.company.toLowerCase().includes(agencySearch.toLowerCase()) || a.name.toLowerCase().includes(agencySearch.toLowerCase()))
                  .map(agency => (
                    <button
                      key={agency.id}
                      onClick={() => setSelectedBuyer({ id: agency.id, company: agency.company })}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${selectedBuyer?.id === agency.id ? 'bg-primary/15 border border-primary/40' : 'hover:bg-muted border border-transparent'}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-black text-primary">
                        {agency.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-tighter text-sm truncate">{agency.company}</p>
                        {agency.name && <p className="text-[10px] text-muted-foreground truncate">{agency.name}</p>}
                      </div>
                      {selectedBuyer?.id === agency.id && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />}
                    </button>
                  ))}
              </div>
              <Button
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-tighter"
                onClick={confirmSold}
                disabled={!selectedBuyer || ownerActionLoading}
              >
                {ownerActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '+ 50 pts — Confirmar venta REVEN'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
