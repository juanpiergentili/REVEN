import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Eye, MessageSquare, Clock, BarChart3, TrendingUp, Award,
  MapPin, Building2, Phone, Mail, Loader2, ShoppingBag, Plus, Settings,
  Instagram, Facebook, ExternalLink, Trash2, User, Activity,
  Save, Pause, Play, CheckCircle2, Package, Lock, Camera, Upload, Globe,
  CreditCard,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getResponseBadge } from '@/src/lib/analytics';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getVehiclesBySeller, updateVehicleStatus, pauseAllSellerListings, deleteVehicle } from '@/src/lib/vehicles';
import { getUserActiveWantedCount } from '@/src/lib/wantedSearches';
import { addPointsToAgency, getAgencyTier, getTierColor } from '@/src/lib/gamification';
import { isTrialUser, isTrialExpired, getTrialDaysRemaining, getTrialEndDate, TRIAL_MAX_LISTINGS } from '@/src/lib/trial';
import { useGeoRef } from '@/src/hooks/useGeoRef';
import { getVehiclePath } from '@/src/lib/seo';
import type { Vehicle, MembershipPlan } from '../types';
import { PLAN_LIMITS } from '../types';

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
  const [activeWantedCount, setActiveWantedCount] = useState(0);
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
        
        if (isOwnProfile) {
          const wantedCount = await getUserActiveWantedCount(targetUid);
          setActiveWantedCount(wantedCount);
        }
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

      // Resolve province/city IDs to display names for listing pages (Agencies, etc.)
      const provinceDisplay = provincias.find(p => p.id === editForm.province)?.nombre || editForm.province || '';
      const cityDisplay = localidades.find(l => l.id === editForm.city)?.nombre || editForm.city || '';

      // Logo IS the universal image (avatarUrl = logoUrl so old references still work)
      const updateData = { ...editForm, avatarUrl: logoUrl, logoUrl, provinceDisplay, cityDisplay, updatedAt: new Date() };
      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Propagate logo + location to all seller's vehicle listings on every save
      const newLocation = cityDisplay ? `${cityDisplay}, ${provinceDisplay}` : provinceDisplay;
      const vehicleUpdates: Record<string, any> = {
        sellerAvatarUrl: logoUrl,
        ...(newLocation && { location: newLocation, province: editForm.province, city: cityDisplay }),
      };
      const vehiclesSnap = await getDocs(query(collection(db, 'vehicles'), where('sellerId', '==', user.uid)));
      if (!vehiclesSnap.empty) {
        await Promise.all(vehiclesSnap.docs.map(v => updateDoc(doc(db, 'vehicles', v.id), vehicleUpdates)));
      }

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

  const handleUpgrade = async (plan: any, cycle: 'monthly' | 'annual') => {
    if (!user) return;
    setEditLoading(true);
    try {
      // Mock MercadoPago Redirect / Payment
      const { createMembership } = await import('@/src/lib/memberships');
      await createMembership({
        userId: user.uid,
        plan: plan,
        billingCycle: cycle,
        discountPercent: profileData.discountCode === 'REVENFREE60' ? 100 : 0,
        discountCode: profileData.discountCode
      });
      
      // Update user plan
      await updateDoc(doc(db, 'users', user.uid), {
        plan: plan,
        status: 'active',
        trialEndDate: null // Remove trial if upgraded
      });
      
      window.location.reload();
    } catch (err) {
      console.error('Error upgrading plan:', err);
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
  const activeListings  = Array.isArray(allListings) ? allListings.filter(v => v.status === 'ACTIVE') : [];
  const pausedListings  = Array.isArray(allListings) ? allListings.filter(v => v.status === 'PAUSED') : [];
  const soldListings    = Array.isArray(allListings) ? allListings.filter(v => v.status === 'SOLD') : [];
  
  const totalViews      = Array.isArray(allListings) ? allListings.reduce((s, v) => s + (Number(v.viewCount) || 0), 0) : 0;
  const totalContacts   = Array.isArray(allListings) ? allListings.reduce((s, v) => s + (Number(v.contactCount) || 0), 0) : 0;
  
  // Computed Advanced Metrics
  const conversionRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;
  const leadQuality = conversionRate > 5 ? 'Alta' : conversionRate > 2 ? 'Media' : 'Baja';
  const rotationIndex = (activeListings.length + soldListings.length) > 0 
    ? (soldListings.length / (activeListings.length + soldListings.length)) * 100 
    : 0;

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
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <span className="text-primary">{(profileData.points || 0).toLocaleString('es-AR')}</span> pts
              </span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard icon={Eye}          label="Vistas totales"     value={totalViews}             accent />
            <StatCard icon={MessageSquare} label="Consultas"          value={totalContacts}          />
            <StatCard icon={TrendingUp}    label="Conv. Lead"         value={`${conversionRate.toFixed(1)}%`} accent />
            <StatCard icon={Activity}      label="Calidad Lead"       value={leadQuality}            />
            <StatCard icon={Package}      label="Stock activo"        value={activeListings.length}  accent />
            <StatCard icon={CheckCircle2} label="Vendidos"           value={soldListings.length}    />
          </div>
          {isOwnProfile && (
            <div className="mt-6 p-6 rounded-3xl border border-primary/10 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Índice de Rotación</p>
                  <p className="text-2xl font-semibold tracking-tighter lowercase">
                    {rotationIndex.toFixed(0)}% de efectividad
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 text-primary font-bold uppercase tracking-widest text-[9px]">ROI Positivo</Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Market Fit</Badge>
              </div>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3 mb-8">
              <CreditCard className="h-6 w-6 text-primary" />
              Plan y Suscripción
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Plan Info */}
              <div className="lg:col-span-1 bg-card border border-border rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Award className="h-24 w-24 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tu Plan Actual</p>
                  <h3 className="text-4xl font-black tracking-tighter uppercase text-primary italic">
                    {profileData.plan || 'business'}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Publicaciones de Stock</span>
                    <span className="font-bold">
                      {activeListings.length} / {PLAN_LIMITS[profileData.plan as MembershipPlan]?.maxVehicles || 5}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (activeListings.length / (PLAN_LIMITS[profileData.plan as MembershipPlan]?.maxVehicles || 5)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Búsquedas (Wanted)</span>
                    <span className="font-bold">
                      {activeWantedCount} / {PLAN_LIMITS[profileData.plan as MembershipPlan]?.maxWantedSearches || 5}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/60 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (activeWantedCount / (PLAN_LIMITS[profileData.plan as MembershipPlan]?.maxWantedSearches || 5)) * 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado de Cuenta</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Activo y Verificado</span>
                  </div>
                </div>
              </div>

              {/* MercadoPago Upgrade Options */}
              <div className="lg:col-span-2 bg-muted/30 border border-border rounded-[2.5rem] p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h4 className="text-xl font-bold tracking-tighter uppercase">Potenciá tu Agencia</h4>
                    <p className="text-xs text-muted-foreground font-medium">Elegí el plan que mejor se adapte a tu volumen de ventas.</p>
                  </div>
                  <div className="flex bg-card p-1 rounded-full border border-border w-fit shrink-0">
                    <button className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase bg-primary text-primary-foreground">Mensual</button>
                    <button className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-muted-foreground hover:text-white transition-colors">Anual -20%</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'professional', name: 'Professional', price: '180', color: 'text-yellow-400', border: 'border-yellow-500/20' },
                    { id: 'enterprise', name: 'Enterprise', price: '300', color: 'text-primary', border: 'border-primary/20' }
                  ].map(p => (
                    <div key={p.id} className={`bg-card p-6 rounded-3xl border ${p.border} hover:scale-[1.02] transition-transform cursor-pointer group`}
                      onClick={() => handleUpgrade(p.id, 'monthly')}>
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`${p.color} bg-white/5 border-current uppercase font-black tracking-widest text-[9px]`}>{p.name}</Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-black tracking-tighter">${p.price}<span className="text-sm text-muted-foreground font-bold">/mes</span></p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Pago seguro vía MercadoPago</p>
                      </div>
                      <Button variant="outline" className="w-full mt-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] h-11 border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        Contratar Ahora
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
              <TabsList className="mb-8 bg-muted rounded-2xl p-1 h-auto gap-1 overflow-x-auto flex-nowrap w-full justify-start">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
            className="group relative bg-card border border-border hover:border-primary/30 rounded-2xl overflow-hidden transition-all duration-500 shadow-sm flex sm:flex-col"
          >
            {/* Photo */}
            <div
              className="relative w-32 shrink-0 sm:w-full sm:aspect-video overflow-hidden cursor-pointer rounded-l-2xl sm:rounded-l-none sm:rounded-t-2xl"
              onClick={() => onNavigate(listing.id)}
            >
              <img
                src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1542362567-b05503f3f7f4?q=80&w=800'}
                alt={`${listing.brand} ${listing.model}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {/* Status badge */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <Badge className={`border font-bold text-[8px] sm:text-[9px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider ${statusCfg.color}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              {/* Year + price - desktop only overlay */}
              <div className="hidden sm:flex absolute top-3 right-3 flex-col gap-1.5 items-end">
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-black text-[10px] px-3 py-1.5 rounded-full uppercase">
                  {listing.year}
                </Badge>
                <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-3 py-1.5 rounded-full uppercase shadow-xl">
                  {listing.currency} {listing.price?.toLocaleString()}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 p-3 flex flex-col gap-2">
              <div className="cursor-pointer" onClick={() => onNavigate(listing.id)}>
                <h3 className="text-sm font-bold tracking-tighter uppercase leading-tight truncate">{listing.brand} {listing.model}</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{listing.version}</p>
                {/* Price - mobile only */}
                <p className="sm:hidden text-base font-black text-primary tracking-tighter mt-1">
                  {listing.currency} {listing.price?.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-primary" /> {listing.viewCount || 0}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-primary" /> {listing.contactCount || 0}</span>
              </div>

              {isOwnProfile && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(listing.id)}
                    className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-border hover:border-primary/30 gap-1"
                  >
                    <Settings className="h-3 w-3 shrink-0" /> Editar
                  </Button>
                  {listing.status !== 'SOLD' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isToggling || isMarkingSold || (trialExpired && listing.status === 'PAUSED') || isDeletingId === listing.id}
                        onClick={() => onToggle(listing)}
                        className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-border hover:border-primary/30 gap-1"
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
                        className="flex-1 rounded-full font-bold uppercase tracking-widest text-[9px] h-8 px-2 border-primary/40 text-primary hover:bg-primary/10 gap-1"
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
