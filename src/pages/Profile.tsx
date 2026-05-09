import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Eye, MessageSquare, Clock, BarChart3, TrendingUp, Award,
  MapPin, Building2, Phone, Mail, Loader2, ShoppingBag, Plus, Settings,
  Instagram, Facebook, ExternalLink, Trash2, User,
  Save, Pause, Play, CheckCircle2, Package, Lock, Camera, Upload, Globe,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getResponseBadge } from '@/src/lib/analytics';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getVehiclesBySeller, updateVehicleStatus, pauseAllSellerListings, deleteVehicle } from '@/src/lib/vehicles';
import { addPointsToAgency, getAgencyTier, getTierColor } from '@/src/lib/gamification';
import { isTrialUser, isTrialExpired, getTrialDaysRemaining, getTrialEndDate, TRIAL_MAX_LISTINGS } from '@/src/lib/trial';
import { useGeoRef } from '@/src/hooks/useGeoRef';
import { getVehiclePath } from '@/src/lib/seo';
import type { Vehicle } from '../types';

function StatCard({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-6 rounded-3xl border space-y-3 ${accent ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}
    >
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${accent ? 'bg-primary/10' : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tighter">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

const STATUS_CONFIG = {
  ACTIVE:   { label: 'Activo',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PAUSED:   { label: 'Pausado',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  SOLD:     { label: 'Vendido',  color: 'bg-primary/20 text-primary border-primary/30' },
  RESERVED: { label: 'Reservado',color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  DRAFT:    { label: 'Borrador', color: 'bg-muted text-muted-foreground border-border' },
} as const;

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [allListings, setAllListings] = useState<Vehicle[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [soldDialogVehicle, setSoldDialogVehicle] = useState<Vehicle | null>(null);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    company: '', province: '', city: '', phone: '', name: '', lastName: '',
    cuit: '', instagram: '', facebook: '', whatsapp: '', avatarUrl: '', logoUrl: '',
    showEmail: true, showPhone: true, showName: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const targetUid = uid || user?.uid;
  const isOwnProfile = !uid || uid === user?.uid;

  const { provincias, localidades, loadingProvincias, loadingLocalidades } = useGeoRef(isEditDialogOpen ? editForm.province : profileData?.province);

  useEffect(() => {
    async function fetchProfile() {
      if (!targetUid) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        let data: any = null;
        if (userDoc.exists()) {
          data = userDoc.data();
          setProfileData(data);
          setEditForm({
            company: data.company || '',
            province: data.province || '',
            city: data.city || '',
            phone: data.phone || '',
            name: data.name || '',
            lastName: data.lastName || '',
            cuit: data.cuit || '',
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            whatsapp: data.whatsapp || '',
            avatarUrl: data.avatarUrl || '',
            logoUrl: data.logoUrl || '',
            showEmail: data.showEmail !== false,
            showPhone: data.showPhone !== false,
            showName: data.showName !== false,
          });
        }
        let vehicles = await getVehiclesBySeller(targetUid);
        // Auto-pause all active listings when trial has expired
        if (isOwnProfile && isTrialExpired(data) && vehicles.some(v => v.status === 'ACTIVE')) {
          await pauseAllSellerListings(targetUid);
          vehicles = vehicles.map(v => v.status === 'ACTIVE' ? { ...v, status: 'PAUSED' as Vehicle['status'] } : v);
        }
        setAllListings(vehicles);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [targetUid]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError(null);
    try {
      let logoUrl = editForm.logoUrl;

      if (logoFile) {
        const logoRef = ref(storage, `users/${user.uid}/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Logo IS the universal image (avatarUrl = logoUrl so old references still work)
      const updateData = { ...editForm, avatarUrl: logoUrl, logoUrl, updatedAt: new Date() };
      await updateDoc(doc(db, 'users', user.uid), updateData);
      setProfileData((prev: any) => ({ ...prev, ...updateData }));
      setLogoFile(null);
      setLogoPreview('');
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setEditError(err?.message || 'Error al guardar. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (vehicle: Vehicle) => {
    const next = vehicle.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (next === 'ACTIVE' && isTrialExpired(profileData)) return;
    if (next === 'ACTIVE' && isTrialUser(profileData) && allListings.filter(v => v.status === 'ACTIVE').length >= TRIAL_MAX_LISTINGS) return;
    setTogglingId(vehicle.id);
    try {
      await updateVehicleStatus(vehicle.id, next);
      setAllListings(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: next } : v));
    } finally {
      setTogglingId(null);
    }
  };

  const handleMarkSold = async (vehicle: Vehicle) => {
    setSoldDialogVehicle(vehicle);
  };

  const confirmMarkSold = async (soldViaReven: boolean) => {
    if (!soldDialogVehicle || !user) return;
    setMarkingSoldId(soldDialogVehicle.id);
    setIsAddingPoints(true);
    try {
      await updateVehicleStatus(soldDialogVehicle.id, 'SOLD');
      if (soldViaReven) {
        await addPointsToAgency(user.uid, 50);
        setProfileData((prev: any) => ({ ...prev, points: (prev.points || 0) + 50 }));
      }
      setAllListings(prev => prev.map(v => v.id === soldDialogVehicle.id ? { ...v, status: 'SOLD' } : v));
    } finally {
      setMarkingSoldId(null);
      setIsAddingPoints(false);
      setSoldDialogVehicle(null);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este vehículo permanentemente?')) return;
    setIsDeletingId(vehicle.id);
    try {
      await deleteVehicle(vehicle.id);
      setAllListings(prev => prev.filter(v => v.id !== vehicle.id));
    } finally {
      setIsDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Perfil no encontrado</h2>
        <Button onClick={() => navigate('/marketplace')}>Volver al Marketplace</Button>
      </div>
    );
  }

  const responseBadge = getResponseBadge(profileData.responseTimestamps || [12, 15, 8, 20]);
  const provinceName = provincias.find(p => p.id === profileData.province)?.nombre || profileData.province || '';
  const cityName = localidades.find(l => l.id === profileData.city)?.nombre || profileData.city || '';

  const trialExpired     = isTrialExpired(profileData);
  const trialUserProfile = isTrialUser(profileData);
  const trialDaysLeft    = getTrialDaysRemaining(profileData);
  const trialEndDate     = getTrialEndDate(profileData);

  // Real metrics computed from actual vehicle data
  const activeListings  = allListings.filter(v => v.status === 'ACTIVE');
  const pausedListings  = allListings.filter(v => v.status === 'PAUSED');
  const soldListings    = allListings.filter(v => v.status === 'SOLD');
  const totalViews      = allListings.reduce((s, v) => s + (v.viewCount || 0), 0);
  const totalContacts   = allListings.reduce((s, v) => s + (v.contactCount || 0), 0);

  // For public profiles only show active listings
  const visibleListings = isOwnProfile ? allListings : activeListings;

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <main className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Button>
          {isOwnProfile && (
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold tracking-widest text-[10px] px-4 py-1.5 rounded-full">
              MI CONCESIONARIA
            </Badge>
          )}
        </div>
        {/* Trial status banner */}
        {isOwnProfile && trialUserProfile && (
          <div className={`mb-10 p-5 rounded-2xl border flex items-center gap-4 ${trialExpired ? 'bg-red-500/5 border-red-500/20' : 'bg-primary/5 border-primary/20'}`}>
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${trialExpired ? 'bg-red-500/10' : 'bg-primary/10'}`}>
              {trialExpired ? <Lock className="h-5 w-5 text-red-400" /> : <Clock className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 space-y-0.5">
              {trialExpired ? (
                <>
                  <p className="font-bold uppercase tracking-widest text-sm text-red-400">Período de prueba vencido</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Tus publicaciones fueron pausadas el {trialEndDate?.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}. Activá tu plan para volver a publicar.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold uppercase tracking-widest text-sm text-primary">Período de prueba activo</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} restantes · {activeListings.length}/{TRIAL_MAX_LISTINGS} publicaciones activas
                  </p>
                </>
              )}
            </div>
            {trialExpired && (
              <Button size="sm" onClick={() => navigate('/')} className="shrink-0 rounded-full h-9 px-5 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                Ver planes
              </Button>
            )}
          </div>
        )}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start gap-8 mb-16"
        >
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
              <AvatarImage src={profileData.logoUrl || profileData.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl">
                {profileData.name?.[0]}{profileData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-card border border-border p-2 rounded-2xl shadow-xl">
              <Award className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase break-words">
                {profileData.company || `${profileData.name} ${profileData.lastName}`}
              </h1>
              <Badge className={`font-black text-[10px] rounded-full px-4 py-1 shadow-lg shadow-primary/20 uppercase tracking-widest border ${getTierColor(getAgencyTier(profileData.points || 0))}`}>
                {getAgencyTier(profileData.points || 0)}
              </Badge>
              <Badge className={`${responseBadge.color} text-white font-bold text-[10px] rounded-full px-4 py-1 uppercase tracking-widest`}>
                {responseBadge.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {profileData.showName !== false && (
                <span className="flex items-center gap-2 font-medium text-foreground/80">
                  <User className="h-4 w-4 text-primary" />
                  <span>{profileData.name} {profileData.lastName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">· APODERADO</span>
                </span>
              )}
              {(cityName || provinceName) && (
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {[cityName, provinceName].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="flex items-center gap-2 font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary" /> Activo ahora
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-2 min-w-0">
              {profileData.showEmail !== false && profileData.email && (
                <span className="flex items-center gap-1.5 min-w-0"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{profileData.email}</span></span>
              )}
              {profileData.showPhone !== false && profileData.phone && (
                <span className="flex items-center gap-1.5 shrink-0"><Phone className="h-3.5 w-3.5" /> {profileData.phone}</span>
              )}
              {profileData.cuit && (
                <span className="flex items-center gap-1.5 shrink-0 font-bold text-white">
                  CUIT: {profileData.cuit}
                </span>
              )}
            </div>

            {(profileData.instagram || profileData.facebook || profileData.whatsapp) && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {profileData.instagram && (
                  <a href={`https://instagram.com/${profileData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-bold">
                    <Instagram className="h-3.5 w-3.5" /> @{profileData.instagram.replace('@', '')}
                  </a>
                )}
                {profileData.facebook && (
                  <a href={`https://facebook.com/${profileData.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-bold">
                    <Facebook className="h-3.5 w-3.5" /> {profileData.facebook}
                  </a>
                )}
                {profileData.whatsapp && (
                  <a href={`https://wa.me/${profileData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-bold">
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="pt-4 flex gap-3 w-full">
                <Button
                  onClick={() => setIsEditDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full font-bold uppercase tracking-wide text-[10px] gap-2 border-primary/20 hover:bg-primary/5 h-10"
                >
                  <Settings className="h-3.5 w-3.5 shrink-0" /> Configurar
                </Button>
                <Button
                  onClick={() => navigate('/publish')}
                  disabled={trialExpired}
                  size="sm"
                  className="flex-1 rounded-full font-bold uppercase tracking-wide text-[10px] gap-2 shadow-lg shadow-primary/20 h-10"
                >
                  {trialExpired ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Plus className="h-3.5 w-3.5 shrink-0" />}
                  {trialExpired ? 'Vencida' : 'Publicar'}
                </Button>
              </div>
            )}
          </div>

          {!isOwnProfile && (
            <Button
              size="lg"
              className="rounded-2xl font-bold uppercase tracking-tighter h-16 px-10 text-lg shadow-lg shadow-primary/20"
              onClick={() => navigate(`/messages?userId=${targetUid}&userName=${encodeURIComponent(profileData.name)}&company=${encodeURIComponent(profileData.company)}`)}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Contactar
            </Button>
          )}
        </motion.div>

        {/* Metrics */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              {isOwnProfile ? 'Métricas de tu Concesionaria' : 'Estadísticas del Vendedor'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={Eye}          label="Vistas totales"     value={totalViews}             accent />
            <StatCard icon={MessageSquare} label="Consultas recibidas" value={totalContacts}          />
            <StatCard icon={Package}      label="Stock activo"        value={activeListings.length}  accent />
            <StatCard icon={CheckCircle2} label="Unidades vendidas"   value={soldListings.length}    />
          </div>
        </div>

        <Separator className="mb-16" />

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              {isOwnProfile ? 'Administrar mi Stock' : 'Unidades Disponibles'}
            </h2>
            {isOwnProfile && (
              <Button onClick={() => navigate('/publish')} disabled={trialExpired} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2">
                {trialExpired ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {trialExpired ? 'Prueba vencida' : 'Nueva Unidad'}
              </Button>
            )}
          </div>

          {visibleListings.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-border rounded-[3rem] space-y-4">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">No hay publicaciones activas en este momento.</p>
              {isOwnProfile && (
                <Button onClick={() => navigate('/publish')} className="rounded-full gap-2">
                  <Plus className="h-4 w-4" /> Publicar primera unidad
                </Button>
              )}
            </div>
          ) : isOwnProfile ? (
            <Tabs defaultValue="all">
              <TabsList className="mb-8 bg-muted rounded-2xl p-1 h-auto gap-1 flex-wrap">
                <TabsTrigger value="all"    className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Todo ({allListings.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  Activos ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="paused" className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 py-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  Pausados ({pausedListings.length})
                </TabsTrigger>
                <TabsTrigger value="sold"   className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Vendidos ({soldListings.length})
                </TabsTrigger>
              </TabsList>

              {(['all', 'active', 'paused', 'sold'] as const).map(tab => {
                const list = tab === 'all' ? allListings
                  : tab === 'active' ? activeListings
                  : tab === 'paused' ? pausedListings
                  : soldListings;
                return (
                  <TabsContent key={tab} value={tab}>
                      <VehicleGrid
                        listings={list}
                        isOwnProfile={isOwnProfile}
                        trialExpired={trialExpired}
                        togglingId={togglingId}
                        markingSoldId={markingSoldId}
                        isDeletingId={isDeletingId}
                        onToggle={handleToggleStatus}
                        onMarkSold={handleMarkSold}
                        onDelete={handleDelete}
                        onNavigate={(id) => {
                          const v = list.find(x => x.id === id);
                          if (v) navigate(getVehiclePath(v.brand, v.model, v.version, v.year, id));
                        }}
                        onEdit={(id) => navigate(`/publish?edit=${id}`)}
                      />
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              <VehicleGrid listings={visibleListings} isOwnProfile={false} togglingId={null} markingSoldId={null} isDeletingId={null} onToggle={() => {}} onMarkSold={() => {}} onDelete={() => {}} onNavigate={(id) => {
                const v = visibleListings.find(x => x.id === id);
                if (v) navigate(getVehiclePath(v.brand, v.model, v.version, v.year, id));
              }} onEdit={() => {}} />
            )}
          </div>
        </main>
  
        {/* Sold Dialog */}
        <Dialog open={!!soldDialogVehicle} onOpenChange={() => setSoldDialogVehicle(null)}>
          <DialogContent className="max-w-md rounded-3xl border-border bg-card p-6">
            <DialogTitle className="text-xl font-bold tracking-tighter uppercase text-center mb-2">Marcar como Vendido</DialogTitle>
            <DialogDescription className="text-center font-medium mb-6">
              ¡Felicitaciones por la venta! ¿Realizaste esta venta a través de REVEN?
            </DialogDescription>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => confirmMarkSold(true)} 
                disabled={isAddingPoints}
                className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20"
              >
                {isAddingPoints ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, lo vendí por la plataforma (+50 pts)'}
              </Button>
              <Button 
                onClick={() => confirmMarkSold(false)} 
                disabled={isAddingPoints}
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 border-border"
              >
                {isAddingPoints ? <Loader2 className="h-4 w-4 animate-spin" /> : 'No, lo vendí por otro medio'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
  
        {/* Edit Dialog */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
        }}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[3rem] border-border bg-card/95 backdrop-blur-2xl p-0 flex flex-col max-h-[90vh]">
          <div className="p-8 pb-6 border-b border-border shrink-0">
            <DialogTitle className="text-3xl font-bold tracking-tighter uppercase">Configuración de Concesionaria</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground mt-1">Vinculá los datos de tu agencia para que se reflejen en tus publicaciones.</DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

            {/* Logo de Agencia */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Logo de Agencia</Label>
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {logoPreview || editForm.logoUrl ? (
                    <img src={logoPreview || editForm.logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 border-border h-9"
                >
                  <Upload className="h-3.5 w-3.5" /> Subir logo
                </Button>
              </div>
            </div>

            {/* Datos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 col-span-1 md:col-span-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Nombre de la Agencia / Concesionaria</Label>
                <Input
                  value={editForm.company}
                  onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Automotores Reven S.A."
                  className="h-14 rounded-[2.5rem] bg-muted border-border font-bold px-6"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Provincia</Label>
                <Select value={editForm.province} onValueChange={v => setEditForm(prev => ({ ...prev, province: v, city: '' }))} disabled={loadingProvincias}>
                  <SelectTrigger className="h-14 rounded-[2.5rem] bg-muted border-border font-bold px-6">
                    <SelectValue>{loadingProvincias ? 'Cargando...' : (provincias.find(p => p.id === editForm.province)?.nombre || 'Seleccionar')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[2.5rem]">
                    {provincias.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Localidad</Label>
                <Select value={editForm.city} onValueChange={v => setEditForm(prev => ({ ...prev, city: v }))} disabled={!editForm.province || loadingLocalidades}>
                  <SelectTrigger className="h-14 rounded-[2.5rem] bg-muted border-border font-bold px-6">
                    <SelectValue>{loadingLocalidades ? 'Cargando...' : (localidades.find(l => l.id === editForm.city)?.nombre || 'Seleccionar')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[2.5rem]">
                    {localidades.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Nombre del Dueño / Apoderado</Label>
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre"
                  className="h-12 rounded-xl bg-muted border-border font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Teléfono Público</Label>
                <Input
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+54 9 11 ..."
                  className="h-12 rounded-xl bg-muted border-border font-bold"
                />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">CUIT</Label>
                <Input
                  value={editForm.cuit}
                  onChange={e => setEditForm(prev => ({ ...prev, cuit: e.target.value }))}
                  placeholder="20-12345678-9"
                  className="h-12 rounded-xl bg-muted border-border font-bold"
                />
              </div>
            </div>

            {/* Visibilidad de contacto */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Visibilidad en el Perfil Público</Label>
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.showName}
                    onChange={e => setEditForm(prev => ({ ...prev, showName: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Mostrar nombre del apoderado</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.showEmail}
                    onChange={e => setEditForm(prev => ({ ...prev, showEmail: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Mostrar email en el perfil</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.showPhone}
                    onChange={e => setEditForm(prev => ({ ...prev, showPhone: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Mostrar teléfono en el perfil</span>
                </label>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Redes Sociales</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editForm.instagram}
                    onChange={e => setEditForm(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                    placeholder="usuario de Instagram"
                    className="h-12 rounded-xl bg-muted border-border font-bold pl-10"
                  />
                </div>
                <div className="relative">
                  <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editForm.facebook}
                    onChange={e => setEditForm(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="Página de Facebook"
                    className="h-12 rounded-xl bg-muted border-border font-bold pl-10"
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editForm.whatsapp}
                    onChange={e => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="WhatsApp (ej: 5491112345678)"
                    className="h-12 rounded-xl bg-muted border-border font-bold pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-border flex flex-col gap-3 shrink-0">
            {editError && (
              <p className="text-xs text-destructive font-bold text-center bg-destructive/10 rounded-xl px-4 py-2">{editError}</p>
            )}
            <div className="flex justify-between gap-4">
              <Button variant="ghost" onClick={() => { setIsEditDialogOpen(false); setEditError(null); }} className="rounded-xl font-bold uppercase tracking-widest text-xs">
                Cancelar
              </Button>
              <Button onClick={handleUpdateProfile} disabled={editLoading} className="rounded-xl font-bold uppercase tracking-widest text-xs gap-2 min-w-[160px]">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleGrid({
  listings, isOwnProfile, trialExpired = false, togglingId, markingSoldId, isDeletingId, onToggle, onMarkSold, onDelete, onNavigate, onEdit,
}: {
  listings: Vehicle[];
  isOwnProfile: boolean;
  trialExpired?: boolean;
  togglingId: string | null;
  markingSoldId: string | null;
  isDeletingId: string | null;
  onToggle: (v: Vehicle) => void;
  onMarkSold: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onNavigate: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-border rounded-[3rem]">
        <p className="text-muted-foreground font-medium text-sm">Sin unidades en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {listings.map((listing, i) => {
        const statusCfg = STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
        const isToggling = togglingId === listing.id;
        const isMarkingSold = markingSoldId === listing.id;

        return (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-card border border-border hover:border-primary/30 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-sm"
          >
            {/* Photo */}
            <div
              className="relative aspect-video overflow-hidden cursor-pointer"
              onClick={() => onNavigate(listing.id)}
            >
              <img
                src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1542362567-b05503f3f7f4?q=80&w=800'}
                alt={`${listing.brand} ${listing.model}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4">
                <Badge className={`border font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider ${statusCfg.color}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-black text-[10px] px-3 py-1.5 rounded-full uppercase">
                  {listing.year}
                </Badge>
                <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-3 py-1.5 rounded-full uppercase shadow-xl">
                  {listing.currency} {listing.price?.toLocaleString()}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <div className="cursor-pointer" onClick={() => onNavigate(listing.id)}>
                <h3 className="text-xl font-bold tracking-tighter uppercase">{listing.brand} {listing.model}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{listing.version}</p>
              </div>

              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-primary" /> {listing.viewCount || 0} Vistas</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-primary" /> {listing.contactCount || 0} Consultas</span>
              </div>

              {isOwnProfile && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(listing.id)}
                    className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-border hover:border-primary/30 gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5 shrink-0" /> Editar
                  </Button>
                  {listing.status !== 'SOLD' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isToggling || isMarkingSold || (trialExpired && listing.status === 'PAUSED') || isDeletingId === listing.id}
                        onClick={() => onToggle(listing)}
                        className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-border hover:border-primary/30 gap-1.5"
                      >
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        ) : trialExpired && listing.status === 'PAUSED' ? (
                          <><Lock className="h-3 w-3 shrink-0" /> Plan</>
                        ) : listing.status === 'ACTIVE' ? (
                          <><Pause className="h-3 w-3 shrink-0" /> Pausar</>
                        ) : (
                          <><Play className="h-3 w-3 shrink-0" /> Activar</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isToggling || isMarkingSold || isDeletingId === listing.id}
                        onClick={() => onMarkSold(listing)}
                        className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                      >
                        {isMarkingSold ? (
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        ) : (
                          <><CheckCircle2 className="h-3 w-3 shrink-0" /> Vendido</>
                        )}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isDeletingId === listing.id}
                    onClick={() => onDelete(listing)}
                    className="flex-none rounded-full h-8 w-8 p-0 border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center"
                    title="Eliminar vehículo"
                  >
                    {isDeletingId === listing.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
