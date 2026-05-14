import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Eye, MessageSquare, Clock, BarChart3, TrendingUp, Award,
  MapPin, Building2, Phone, Mail, Loader2, ShoppingBag, Plus, Settings,
  Instagram, Facebook, ExternalLink, Trash2, User, Activity, Fingerprint, Shield,
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
import { PLAN_LIMITS, normalizePlan, PLAN_PRICES } from '../types';

function formatARS(amount: number) {
  return `$ ${amount.toLocaleString('es-AR')}`;
}

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showUpgradeRequested, setShowUpgradeRequested] = useState(false);

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
      // Create membership record
      const { createMembership } = await import('@/src/lib/memberships');
      await createMembership({
        userId: user.uid,
        plan: plan,
        billingCycle: cycle,
        discountPercent: profileData.discountCode === 'REVENFREE60' ? 100 : 0,
        discountCode: profileData.discountCode
      });
      
      // Instead of immediate activation, set a pending status for admin approval
      await updateDoc(doc(db, 'users', user.uid), {
        pendingPlanUpgrade: plan,
        pendingBillingCycle: cycle,
        upgradeRequestedAt: new Date()
      });
      
      setShowUpgradeRequested(true);
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
  const currentPlan      = normalizePlan(profileData?.plan);

  // Real metrics computed from actual vehicle data
  const activeListings  = Array.isArray(allListings) ? allListings.filter(v => v.status === 'ACTIVE') : [];
  const pausedListings  = Array.isArray(allListings) ? allListings.filter(v => v.status === 'PAUSED') : [];
  const soldListings    = Array.isArray(allListings) ? allListings.filter(v => v.status === 'SOLD') : [];
  
  const totalViews      = Array.isArray(allListings) ? allListings.reduce((s, v) => s + (Number(v?.viewCount) || 0), 0) : 0;
  const totalContacts   = Array.isArray(allListings) ? allListings.reduce((s, v) => s + (Number(v?.contactCount) || 0), 0) : 0;
  
  // Computed Advanced Metrics
  // conversionRate now represents the "Closing Rate" (Leads to Sales)
  const conversionRate = totalContacts > 0 
    ? (soldListings.length / totalContacts) * 100 
    : (soldListings.length > 0 ? 100 : 0);
    
  const leadQuality = conversionRate > 15 ? 'Alta' : conversionRate > 5 ? 'Media' : 'Baja';
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
            <StatCard icon={TrendingUp}    label="Conv. de Leads"     value={`${conversionRate.toFixed(1)}%`} accent />
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
                    {currentPlan}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Publicaciones de Stock</span>
                    <span className="font-bold">
                      {activeListings.length} / {PLAN_LIMITS[currentPlan]?.maxVehicles || 5}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (activeListings.length / (PLAN_LIMITS[currentPlan]?.maxVehicles || 5)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Búsquedas (Wanted)</span>
                    <span className="font-bold">
                      {activeWantedCount} / {PLAN_LIMITS[currentPlan]?.maxWantedSearches || 5}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/60 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (activeWantedCount / (PLAN_LIMITS[currentPlan]?.maxWantedSearches || 5)) * 100)}%` }} 
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
                    <button 
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
                    >
                      Mensual
                    </button>
                    <button 
                      onClick={() => setBillingCycle('annual')}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${billingCycle === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
                    >
                      Anual -20%
                    </button>
                  </div>
                </div>
                
                {currentPlan === 'enterprise' ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in duration-700">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                      <div className="relative h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Award className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <h4 className="text-2xl font-black tracking-tighter uppercase italic">¡Felicidades!</h4>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Ya tenés la mejor opción para impulsar tus ventas. <br />
                        Tu cuenta <span className="text-primary font-bold uppercase italic">Enterprise</span> está activa con beneficios ilimitados.
                      </p>
                    </div>
                    <Button variant="outline" className="rounded-full border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px] h-10 px-8">
                      Ver Beneficios Exclusivos
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'professional', name: 'Professional', color: 'text-yellow-400', border: 'border-yellow-500/20' },
                      { id: 'enterprise', name: 'Enterprise', color: 'text-primary', border: 'border-primary/20' }
                    ].filter(p => {
                      if (currentPlan === 'business') return true;
                      if (currentPlan === 'professional') return p.id === 'enterprise';
                      return false;
                    }).map(p => (
                      <div key={p.id} className={`bg-card p-6 rounded-3xl border ${p.border} hover:scale-[1.02] transition-transform cursor-pointer group`}
                        onClick={() => handleUpgrade(p.id, billingCycle)}>
                        <div className="flex justify-between items-start mb-4">
                          <Badge className={`${p.color} bg-white/5 border-current uppercase font-black tracking-widest text-[9px]`}>{p.name}</Badge>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-black tracking-tighter">
                            {formatARS(billingCycle === 'annual' ? PLAN_PRICES[p.id as MembershipPlan].annual : PLAN_PRICES[p.id as MembershipPlan].monthly)}
                            <span className="text-sm text-muted-foreground font-bold">/{billingCycle === 'annual' ? 'año' : 'mes'}</span>
                          </p>
                          {billingCycle === 'annual' && (
                            <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                              Ahorrás {formatARS(PLAN_PRICES[p.id as MembershipPlan].monthly * 12 - PLAN_PRICES[p.id as MembershipPlan].annual)}
                            </p>
                          )}
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Pago seguro vía MercadoPago</p>
                        </div>
                        <Button variant="outline" className="w-full mt-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] h-11 border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          Contratar Ahora
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b border-border shrink-0">
              <TabsList className="bg-transparent border-none p-0 h-12 gap-6">
                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase tracking-widest text-[10px]">General</TabsTrigger>
                <TabsTrigger value="plan" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase tracking-widest text-[10px]">Mi Plan</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="px-8 py-6 space-y-8">
                {/* Logo de Agencia */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Logo de Agencia</Label>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-inner">
                      {logoPreview || editForm.logoUrl ? (
                        <img src={logoPreview || editForm.logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
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
                      className="h-14 rounded-[1.5rem] bg-muted border-border font-bold px-6 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Provincia</Label>
                    <Select value={editForm.province} onValueChange={v => setEditForm(prev => ({ ...prev, province: v, city: '' }))} disabled={loadingProvincias}>
                      <SelectTrigger className="h-14 rounded-[1.5rem] bg-muted border-border font-bold px-6">
                        <SelectValue>{loadingProvincias ? 'Cargando...' : (provincias.find(p => p.id === editForm.province)?.nombre || 'Seleccionar')}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem]">
                        {provincias.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Localidad</Label>
                    <Select value={editForm.city} onValueChange={v => setEditForm(prev => ({ ...prev, city: v }))} disabled={!editForm.province || loadingLocalidades}>
                      <SelectTrigger className="h-14 rounded-[1.5rem] bg-muted border-border font-bold px-6">
                        <SelectValue>{loadingLocalidades ? 'Cargando...' : (localidades.find(l => l.id === editForm.city)?.nombre || 'Seleccionar')}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem]">
                        {localidades.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Nombre del Dueño / Apoderado</Label>
                    <Input
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre"
                      className="h-14 rounded-[1.5rem] bg-muted border-border font-bold px-6"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Teléfono Público</Label>
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+54 9 11 ..."
                      className="h-14 rounded-[1.5rem] bg-muted border-border font-bold px-6"
                    />
                  </div>
                </div>

                {/* Redes Sociales */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Redes Sociales</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editForm.instagram}
                        onChange={e => setEditForm(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                        placeholder="Instagram"
                        className="h-12 rounded-xl bg-muted border-border font-bold pl-11"
                      />
                    </div>
                    <div className="relative">
                      <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editForm.facebook}
                        onChange={e => setEditForm(prev => ({ ...prev, facebook: e.target.value }))}
                        placeholder="Facebook"
                        className="h-12 rounded-xl bg-muted border-border font-bold pl-11"
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editForm.whatsapp}
                        onChange={e => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="WhatsApp"
                        className="h-12 rounded-xl bg-muted border-border font-bold pl-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="plan" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="px-8 py-6 space-y-8">
                {/* Current Plan Card */}
                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Award className="h-24 w-24 text-primary" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan Vigente</p>
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic text-primary">REVEN {currentPlan}</h3>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase font-black text-[9px] px-3 py-1 rounded-full">Activo</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Último Pago</p>
                        <p className="font-bold text-sm">{profileData.lastPaymentDate ? new Date(profileData.lastPaymentDate).toLocaleDateString('es-AR') : '01/05/2026'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vencimiento</p>
                        <p className="font-bold text-sm text-primary">{profileData.nextPaymentDate ? new Date(profileData.nextPaymentDate).toLocaleDateString('es-AR') : '01/06/2026'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Límites y Consumo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-tighter">Publicaciones</span>
                        <span className="text-xs font-black">{activeListings.length} / {PLAN_LIMITS[currentPlan]?.maxVehicles || 5}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (activeListings.length / (PLAN_LIMITS[currentPlan]?.maxVehicles || 5)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-tighter">Búsquedas Wanted</span>
                        <span className="text-xs font-black">{activeWantedCount} / {PLAN_LIMITS[currentPlan]?.maxWantedSearches || 5}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (activeWantedCount / (PLAN_LIMITS[currentPlan]?.maxWantedSearches || 5)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Rendimiento de Cuenta</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                      <Eye className="h-4 w-4 mx-auto text-primary opacity-50" />
                      <p className="text-xl font-black tracking-tighter">
                        {Array.isArray(allListings) ? allListings.reduce((acc, l) => acc + (Number(l?.viewCount) || 0), 0) : 0}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Vistas</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                      <MessageSquare className="h-4 w-4 mx-auto text-primary opacity-50" />
                      <p className="text-xl font-black tracking-tighter">
                        {Array.isArray(allListings) ? allListings.reduce((acc, l) => acc + (Number(l?.contactCount) || 0), 0) : 0}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Leads</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                      <TrendingUp className="h-4 w-4 mx-auto text-primary opacity-50" />
                      <p className="text-xl font-black tracking-tighter">
                        {Array.isArray(allListings) && allListings.length > 0 
                          ? Math.round((allListings.reduce((acc, l) => acc + (Number(l?.contactCount) || 0), 0) / allListings.reduce((acc, l) => acc + (Number(l?.viewCount) || 0), 1)) * 100) 
                          : 0}%
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Conv.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                      <Clock className="h-4 w-4 mx-auto text-primary opacity-50" />
                      <p className="text-xl font-black tracking-tighter">
                        {(() => {
                          const nextDate = profileData?.nextPaymentDate;
                          const dateObj = (nextDate && typeof nextDate === 'object' && 'seconds' in nextDate) 
                            ? new Date(nextDate.seconds * 1000) 
                            : new Date(nextDate || '2026-06-01');
                          const diff = dateObj.getTime() - new Date().getTime();
                          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                        })()}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Días</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                      <Shield className="h-4 w-4 mx-auto text-primary opacity-50" />
                      <p className="text-xl font-black tracking-tighter">
                        {Object.keys(profileData?.sessions || {}).length} / {PLAN_LIMITS[currentPlan]?.maxSessions || 1}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Sesiones</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Simulation */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Facturación</h4>
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Factura</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</span>
                    </div>
                    <div className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight uppercase">Mayo 2026</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">REVEN-{currentPlan.toUpperCase()}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase tracking-widest">Pagado</Badge>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center font-medium uppercase tracking-widest">Las facturas son generadas automáticamente por MercadoPago.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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

      {/* Upgrade Requested Dialog */}
      <Dialog open={showUpgradeRequested} onOpenChange={setShowUpgradeRequested}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <div className="py-12 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black tracking-tighter uppercase italic">Solicitud Enviada</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">
                Tu solicitud de cambio de plan ha sido recibida correctamente. <br />
                Nuestro equipo comercial se contactará con vos para finalizar la activación.
              </p>
            </div>
            <Button 
              onClick={() => { setShowUpgradeRequested(false); window.location.reload(); }}
              className="rounded-full h-12 px-12 font-bold uppercase tracking-widest text-xs"
            >
              Entendido
            </Button>
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
