import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getAgencyTier, getTierColor } from '@/src/lib/gamification';

export function Agencies() {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((u: any) => u.role !== 'ADMIN');
        setAgencies(users);
      } catch (err) {
        console.error('Error fetching agencies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgencies();
  }, []);

  const filtered = agencies.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.company || '').toLowerCase().includes(q) ||
      (a.name || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q) ||
      (a.province || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="mb-12 space-y-4">
        <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-tighter px-4 py-1.5 rounded-full text-sm">
          DIRECTORIO B2B
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">Agencias</h1>
        <p className="text-muted-foreground font-medium max-w-lg">
          Encontrá concesionarios y agencias miembros de la red REVEN. Hacé clic para ver su perfil y stock disponible.
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa o localidad..."
          className="pl-12 h-14 rounded-2xl bg-muted border-border font-bold text-base"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
          <p className="font-bold uppercase tracking-widest text-muted-foreground">Sin resultados para "{search}"</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
            {filtered.length} agencia{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((agency, i) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-5 p-5 rounded-3xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                onClick={() => navigate(`/profile/${agency.id}`)}
              >
                <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={agency.logoUrl || agency.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {((agency.company || agency.name || '?')[0] || '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold uppercase tracking-tighter text-base truncate">
                    {agency.company || `${agency.name || ''} ${agency.lastName || ''}`.trim() || 'Agencia'}
                  </h3>
                  {agency.company && (
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                      {agency.name} {agency.lastName}
                    </p>
                  )}
                  {(agency.city || agency.province) && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      {[agency.city, agency.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={`font-black text-[9px] rounded-full px-3 py-0.5 uppercase tracking-widest shadow-md border ${getTierColor(getAgencyTier(agency.points || 0))}`}>
                    {getAgencyTier(agency.points || 0)}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
