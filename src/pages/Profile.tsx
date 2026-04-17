import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, MessageSquare, Clock, BarChart3, Calendar, TrendingUp, Award, MapPin, Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';
import { formatLastOnline, getAverageResponseTime, getResponseBadge } from '@/src/lib/analytics';

// Demo profile data — will be replaced by Firestore fetch
const DEMO_PROFILES: Record<string, {
  name: string; company: string; province: string; city: string; email: string; phone: string;
  plan: string; status: string; lastOnline: string; responseTimestamps: number[];
  totalProfileViews: number; totalListingViews: number; totalContactClicks: number;
  listings: { id: string; brand: string; model: string; version: string; year: number; price: number; currency: string; photo: string; viewCount: number; contactCount: number; publishedAt: string; lastModifiedAt: string; }[];
}> = {
  'demo-user': {
    name: 'Juan Pier Gentili', company: 'REVEN Automotores', province: 'Buenos Aires', city: 'San Isidro',
    email: 'juan@reven.com', phone: '+54 11 5555-1234', plan: 'Platinum', status: 'approved',
    lastOnline: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    responseTimestamps: [12, 8, 25, 15, 10, 5, 30, 20],
    totalProfileViews: 1847, totalListingViews: 12450, totalContactClicks: 389,
    listings: [
      { id: '1', brand: 'Toyota', model: 'Hilux', version: '2.8 SRX 4X4 AT', year: 2023, price: 48500, currency: 'USD', photo: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=400', viewCount: 245, contactCount: 12, publishedAt: '2024-02-15T10:00:00Z', lastModifiedAt: '2024-03-10T10:00:00Z' },
      { id: '2', brand: 'Volkswagen', model: 'Amarok', version: 'V6 Extreme', year: 2024, price: 58500, currency: 'USD', photo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400', viewCount: 512, contactCount: 28, publishedAt: '2024-03-01T10:00:00Z', lastModifiedAt: '2024-03-12T10:00:00Z' },
      { id: '3', brand: 'Ford', model: 'Ranger', version: 'V6 Limited Plus', year: 2024, price: 62000, currency: 'USD', photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400', viewCount: 678, contactCount: 35, publishedAt: '2024-01-20T10:00:00Z', lastModifiedAt: '2024-03-08T10:00:00Z' },
      { id: '4', brand: 'Peugeot', model: '208', version: 'Feline 1.6 AT', year: 2022, price: 19500, currency: 'USD', photo: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=400', viewCount: 134, contactCount: 8, publishedAt: '2024-03-05T10:00:00Z', lastModifiedAt: '2024-03-11T10:00:00Z' },
    ],
  },
};

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

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const profileId = uid || 'demo-user';
  const profile = DEMO_PROFILES[profileId] || DEMO_PROFILES['demo-user'];
  const responseBadge = getResponseBadge(profile.responseTimestamps);
  const isOwnProfile = !uid || uid === 'demo-user';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40">
        <div className="container mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start gap-8 mb-16"
        >
          <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-2xl">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
              {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tighter uppercase">{profile.name}</h1>
              <Badge className="bg-primary text-primary-foreground font-bold text-[10px] rounded-full px-3 shadow-lg shadow-primary/20">
                {profile.plan}
              </Badge>
              <Badge className={`${responseBadge.color} text-white font-bold text-[10px] rounded-full px-3`}>
                {responseBadge.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-bold"><Building2 className="h-4 w-4 text-primary" /> {profile.company}</span>
              <span className="flex items-center gap-1.5 font-bold"><MapPin className="h-4 w-4 text-primary" /> {profile.city}, {profile.province}</span>
              <span className="flex items-center gap-1.5 font-bold"><Clock className="h-4 w-4 text-primary" /> {formatLastOnline(profile.lastOnline)}</span>
            </div>
            {isOwnProfile && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-bold">Tiempo promedio de respuesta: {getAverageResponseTime(profile.responseTimestamps)}</span>
            </div>
          </div>
          {!isOwnProfile && (
            <Button
              size="lg"
              className="rounded-2xl font-bold uppercase tracking-tighter shadow-lg shadow-primary/20"
              onClick={() => navigate(`/messages?userId=${profileId}&userName=${encodeURIComponent(profile.name)}&company=${encodeURIComponent(profile.company)}`)}
            >
              <MessageSquare className="mr-2 h-5 w-5" /> Contactar
            </Button>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-8">
            {isOwnProfile ? 'Tus Métricas' : 'Estadísticas'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={Eye} label="Vistas al perfil" value={profile.totalProfileViews} accent />
            <StatCard icon={BarChart3} label="Vistas publicaciones" value={profile.totalListingViews} />
            <StatCard icon={MessageSquare} label="Clicks contactar" value={profile.totalContactClicks} accent />
            <StatCard icon={TrendingUp} label="Publicaciones activas" value={profile.listings.length} />
          </div>
        </div>

        <Separator className="bg-white/5 mb-16" />

        {/* Listings */}
        <div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-8">
            {isOwnProfile ? 'Mis Publicaciones' : 'Publicaciones'}
          </h2>
          <div className="space-y-4">
            {profile.listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col md:flex-row items-start gap-6 p-6 rounded-3xl bg-card/50 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/vehicle/${listing.id}`)}
              >
                <img
                  src={listing.photo}
                  alt={`${listing.brand} ${listing.model}`}
                  className="w-full md:w-48 h-32 object-cover rounded-2xl group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tighter uppercase">{listing.brand} {listing.model}</h3>
                    <p className="text-xl font-bold text-primary tracking-tighter">{listing.currency} {listing.price.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{listing.version} · {listing.year}</p>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-primary" /> {listing.viewCount} vistas</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-primary" /> {listing.contactCount} contactos</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Publicado hace {daysSince(listing.publishedAt)} días</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Editado hace {daysSince(listing.lastModifiedAt)} días</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
