import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, MessageSquare, Clock, BarChart3, Calendar, TrendingUp, Award, MapPin, Building2, Phone, Mail, Loader2, ShoppingBag, Plus, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatLastOnline, getAverageResponseTime, getResponseBadge } from '@/src/lib/analytics';
import { useAuth, db } from '@/src/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { PROVINCIAS_ARGENTINA } from '@/src/data/argentina-geo';
import { MOCK_VEHICLES_FALLBACK } from '@/src/data/mock-vehicles';
import type { Vehicle } from '../types';

function StatCard({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-6 rounded-3xl border space-y-3 ${accent ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5'}`}
    >
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${accent ? 'bg-primary/10' : 'bg-white/5'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tighter">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function daysSince(dateStr: any): number {
  if (!dateStr) return 0;
  const date = typeof dateStr === 'string' ? new Date(dateStr) : (dateStr.toDate ? dateStr.toDate() : new Date(dateStr));
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [userListings, setUserListings] = useState<Vehicle[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    company: '',
    province: '',
    city: '',
    phone: '',
    name: '',
    lastName: ''
  });
  
  const targetUid = uid || user?.uid;
  const isOwnProfile = !uid || uid === user?.uid;

  useEffect(() => {
    async function fetchProfile() {
      if (!targetUid) return;
      
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
          setEditForm({
            company: data.company || '',
            province: data.province || '',
            city: data.city || '',
            phone: data.phone || '',
            name: data.name || '',
            lastName: data.lastName || ''
          });
          
          const listingsQuery = query(
            collection(db, 'vehicles'),
            where('sellerId', '==', targetUid),
            orderBy('createdAt', 'desc')
          );
          const listingsSnap = await getDocs(listingsQuery);
          const realVehicles = listingsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Vehicle));
          
          let mockListings: Vehicle[] = [];
          if (data.email === 'vendedor.test@reven.com.ar') {
            mockListings = MOCK_VEHICLES_FALLBACK.filter(v => ['1', '2', '3'].includes(v.id));
          }
          
          setUserListings([...realVehicles, ...mockListings]);
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
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...editForm,
        updatedAt: new Date()
      });
      setProfileData((prev: any) => ({ ...prev, ...editForm }));
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setEditLoading(false);
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

  const responseTimestamps = profileData.responseTimestamps || [12, 15, 8, 20];
  const responseBadge = getResponseBadge(responseTimestamps);
  
  const provinceName = PROVINCIAS_ARGENTINA.find(p => p.id === profileData.province)?.nombre || profileData.province || 'No especificada';
  const cityName = PROVINCIAS_ARGENTINA.find(p => p.id === profileData.province)?.localidades.find(l => l.id === profileData.city)?.nombre || profileData.city || '';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-20 z-40">
        <div className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Button>
          {isOwnProfile && (
            <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-widest text-[10px] px-4 py-1.5 rounded-full">
              GESTIÓN DE CONCESIONARIA
            </Badge>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start gap-8 mb-16"
        >
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
              <AvatarImage src={profileData.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl">
                {profileData.name?.[0]}{profileData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-background border border-white/5 p-2 rounded-2xl shadow-xl">
              <Award className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">{profileData.name} {profileData.lastName}</h1>
              <Badge className="bg-primary text-primary-foreground font-black text-[10px] rounded-full px-4 py-1 shadow-lg shadow-primary/20 uppercase tracking-widest">
                {profileData.plan || 'Standard'}
              </Badge>
              <Badge className={`${responseBadge.color} text-white font-bold text-[10px] rounded-full px-4 py-1 uppercase tracking-widest`}>
                {responseBadge.label}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 font-bold text-white/80">
                <Building2 className="h-4 w-4 text-primary" /> {profileData.company || 'Agencia Independiente'}
              </span>
              <span className="flex items-center gap-2 font-bold text-white/80">
                <MapPin className="h-4 w-4 text-primary" /> {cityName}{cityName ? ', ' : ''}{provinceName}
              </span>
              <span className="flex items-center gap-2 font-bold text-white/80">
                <Clock className="h-4 w-4 text-primary" /> Activo ahora
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {profileData.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {profileData.phone}</span>
            </div>
            
            {isOwnProfile && (
              <div className="pt-4 flex gap-4">
                <Button 
                  onClick={() => setIsEditDialogOpen(true)}
                  variant="outline" 
                  size="sm"
                  className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5 h-10 px-6"
                >
                  <Settings className="h-3.5 w-3.5" /> Configurar Mi Concesionaria
                </Button>
                <Button 
                  onClick={() => navigate('/publish')}
                  variant="default" 
                  size="sm"
                  className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20 h-10 px-6"
                >
                  <Plus className="h-3.5 w-3.5" /> Publicar Unidad
                </Button>
              </div>
            )}
          </div>

          {!isOwnProfile && (
            <Button
              size="lg"
              className="rounded-2xl font-bold uppercase tracking-tighter h-16 px-10 text-lg shadow-lg shadow-primary/20 italic"
              onClick={() => navigate(`/messages?userId=${targetUid}&userName=${encodeURIComponent(profileData.name)}&company=${encodeURIComponent(profileData.company)}`)}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Contactar
            </Button>
          )}
        </motion.div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              {isOwnProfile ? 'Métricas de tu Concesionaria' : 'Estadísticas del Vendedor'}
            </h2>
            {isOwnProfile && (
              <Button variant="outline" className="rounded-full border-primary/20 text-[10px] font-bold uppercase tracking-widest h-9">
                Ver reporte completo
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={Eye} label="Vistas al perfil" value={profileData.totalProfileViews || 0} accent />
            <StatCard icon={TrendingUp} label="Vistas publicaciones" value={profileData.totalListingViews || 0} />
            <StatCard icon={MessageSquare} label="Conversaciones" value={profileData.totalContactClicks || 0} accent />
            <StatCard icon={Award} label="Stock Activo" value={userListings.length} />
          </div>
        </div>

        <Separator className="bg-white/5 mb-16" />

        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              {isOwnProfile ? 'Administrar mi Stock' : 'Unidades Disponibles'}
            </h2>
            {isOwnProfile && (
              <Button onClick={() => navigate('/publish')} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2">
                <Plus className="h-4 w-4" /> Nueva Unidad
              </Button>
            )}
          </div>

          {userListings.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-4">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">No hay publicaciones activas en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-white/5 border border-white/5 hover:border-primary/30 rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer"
                  onClick={() => navigate(`/vehicle/${listing.id}`)}
                >
                  <div className="flex aspect-video overflow-hidden">
                    <img
                      src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1542362567-b05503f3f7f4?q=80&w=800'}
                      alt={`${listing.brand} ${listing.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-black text-[10px] px-3 py-1.5 rounded-full uppercase tracking-tighter">
                        {listing.year}
                      </Badge>
                      <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-xl">
                        {listing.currency} {listing.price?.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tighter uppercase">{listing.brand} {listing.model}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{listing.version}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-primary" /> {listing.viewCount || 0} Vistas</span>
                      <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-primary" /> {listing.contactCount || 0} Consultas</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] border-border bg-card/95 backdrop-blur-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold tracking-tighter uppercase">Configuración de Concesionaria</DialogTitle>
            <DialogDescription className="font-medium text-white/50">Vinculá los datos de tu agencia para que se reflejen en tus publicaciones.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-3 col-span-1 md:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Nombre de la Agencia / Concesionaria</Label>
              <Input 
                value={editForm.company}
                onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Automotores Reven S.A." 
                className="h-14 rounded-[2.5rem] bg-white/5 border-white/10 font-bold px-6"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-primary">Provincia</Label>
              <Select 
                value={editForm.province} 
                onValueChange={v => setEditForm(prev => ({ ...prev, province: v, city: '' }))}
              >
                <SelectTrigger className="h-14 rounded-[2.5rem] bg-white/5 border-white/10 font-bold px-6">
                  <SelectValue>
                    {PROVINCIAS_ARGENTINA.find(p => p.id === editForm.province)?.nombre || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[2.5rem]">
                  {PROVINCIAS_ARGENTINA.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Localidad</Label>
              <Select 
                value={editForm.city} 
                onValueChange={v => setEditForm(prev => ({ ...prev, city: v }))}
                disabled={!editForm.province}
              >
                <SelectTrigger className="h-14 rounded-[2.5rem] bg-white/5 border-white/10 font-bold px-6">
                  <SelectValue>
                    {PROVINCIAS_ARGENTINA.find(p => p.id === editForm.province)?.localidades.find(l => l.id === editForm.city)?.nombre || 'Seleccionar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[2.5rem]">
                  {PROVINCIAS_ARGENTINA.find(p => p.id === editForm.province)?.localidades.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Teléfono Público</Label>
              <Input 
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+54 9 11 ..." 
                className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Tu Nombre de Contacto</Label>
              <Input 
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre" 
                className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-xs">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={editLoading}
              className="rounded-xl font-bold uppercase tracking-widest text-xs gap-2 min-w-[140px]"
            >
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
