import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronDown, ChevronLeft, MessageCircle, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { subscribeToVehicles } from '@/src/lib/vehicles';
import { subscribeToWantedSearches, createWantedSearch } from '@/src/lib/wantedSearches';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/src/components/marketplace/VehicleCard';
import { FilterSidebar, FilterState, INITIAL_FILTERS } from '@/src/components/marketplace/FilterSidebar';
import { FilterChips } from '@/src/components/marketplace/FilterChips';
import { Vehicle, WantedSearch } from '@/src/types';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, db } from '@/src/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

const MOCK_WANTED: WantedSearch[] = [
  {
    id: 'w1', userId: 'u1', userName: 'Marcos Galarza', companyName: 'Galarza Trucks',
    brand: 'Toyota', model: 'Hilux',
    yearRange: { min: 2020, max: 2024 }, budgetRange: { min: 35000, max: 45000 },
    currency: 'USD', description: 'Busco Hilux SRX 4x4, pocos km, color blanco o gris plata.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w2', userId: 'u2', userName: 'Marina Soler', companyName: 'LuxCars',
    brand: 'Volkswagen', model: 'Amarok',
    yearRange: { min: 2022, max: 2024 }, budgetRange: { min: 40000, max: 55000 },
    currency: 'USD', description: 'Necesito Amarok V6 para cliente directo. Pago contado.',
    createdAt: new Date().toISOString(),
  }
];

const MOCK_VEHICLES_FALLBACK: Vehicle[] = [
  {
    id: '1', sellerId: 's1', sellerName: 'Concesionaria Norte',
    brand: 'Toyota', model: 'Hilux', version: '2.8 SRX 4X4 AT',
    year: 2023, km: 15000, fuelType: 'DIESEL', bodyType: 'Pick Up', transmission: 'AUTOMATICO', color: 'blanco',
    condition: 'USADO', location: 'San Isidro, GBA', province: 'buenosaires', city: 'San Isidro',
    price: 48500, currency: 'USD', status: 'ACTIVE', isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800'],
    description: 'Impecable estado, único dueño.', createdAt: new Date().toISOString(),
    isInspected: true, hasVTV: true, hasPatenteAlDay: true, viewCount: 245, contactCount: 12,
  },
  {
    id: '2', sellerId: 's2', sellerName: 'Sport Cars',
    brand: 'Volkswagen', model: 'Amarok', version: 'V6 Extreme 4x4',
    year: 2024, km: 0, fuelType: 'DIESEL', bodyType: 'Pick Up', transmission: 'AUTOMATICO', color: 'gris',
    condition: '0KM', location: 'Palermo, CABA', province: 'caba', city: 'Palermo',
    price: 58500, currency: 'USD', status: 'ACTIVE', isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    description: 'Entrega inmediata. Varios colores.', createdAt: new Date().toISOString(),
    isInspected: true, hasVTV: true, hasPatenteAlDay: true, viewCount: 512, contactCount: 28,
  },
  {
    id: '3', sellerId: 's3', sellerName: 'Auto Premium',
    brand: 'Fiat', model: 'Cronos', version: 'Precision 1.3 GSE',
    year: 2023, km: 12000, fuelType: 'NAFTA', bodyType: 'Sedán', transmission: 'MANUAL', color: 'gris',
    condition: 'USADO', location: 'Pilar, GBA', province: 'buenosaires', city: 'Pilar',
    price: 16500000, currency: 'ARS', status: 'ACTIVE', isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800'],
    description: 'El más vendido del país.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 89, contactCount: 5,
  },
  {
    id: '4', sellerId: 's1', sellerName: 'Concesionaria Norte',
    brand: 'Peugeot', model: '208', version: 'Feline 1.6 AT',
    year: 2022, km: 28000, fuelType: 'NAFTA', bodyType: 'Hatchback', transmission: 'AUTOMATICO', color: 'blanco',
    condition: 'USADO', location: 'San Isidro, GBA', province: 'buenosaires', city: 'San Isidro',
    price: 19500, currency: 'USD', status: 'ACTIVE', isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800'],
    description: 'Service oficiales al día.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 134, contactCount: 8,
  },
  {
    id: '5', sellerId: 's4', sellerName: 'Mundo Autos',
    brand: 'Ford', model: 'Ranger', version: 'V6 Limited Plus 4x4',
    year: 2024, km: 0, fuelType: 'DIESEL', bodyType: 'Pick Up', transmission: 'AUTOMATICO', color: 'rojo',
    condition: '0KM', location: 'Córdoba Capital', province: 'cordoba', city: 'Córdoba Capital',
    price: 62000, currency: 'USD', status: 'ACTIVE', isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'],
    description: 'Nueva generación, tope de gama.', createdAt: new Date().toISOString(),
    isInspected: true, hasVTV: true, hasPatenteAlDay: true, viewCount: 678, contactCount: 35,
  },
  {
    id: '6', sellerId: 's2', sellerName: 'Sport Cars',
    brand: 'Renault', model: 'Duster', version: '1.3 T Iconic CVT',
    year: 2025, km: 0, fuelType: 'NAFTA', bodyType: 'SUV', transmission: 'AUTOMATICO', color: 'gris',
    condition: '0KM', location: 'Palermo, CABA', province: 'caba', city: 'Palermo',
    price: 32000, currency: 'USD', status: 'ACTIVE', isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'],
    description: 'Nuevo Duster, entrega inmediata.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 321, contactCount: 18,
  },
  {
    id: '7', sellerId: 's3', sellerName: 'Auto Premium',
    brand: 'Jeep', model: 'Compass', version: 'Limited 1.3T AT',
    year: 2023, km: 8000, fuelType: 'NAFTA', bodyType: 'SUV', transmission: 'AUTOMATICO', color: 'negro',
    condition: 'USADO', location: 'Pilar, GBA', province: 'buenosaires', city: 'Pilar',
    price: 38500, currency: 'USD', status: 'ACTIVE', isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&q=80&w=800'],
    description: 'Tope de gama, impecable.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 456, contactCount: 22,
  },
  {
    id: '8', sellerId: 's4', sellerName: 'Mundo Autos',
    brand: 'Chevrolet', model: 'Tracker', version: '1.2 T LT AT',
    year: 2024, km: 5000, fuelType: 'NAFTA', bodyType: 'SUV', transmission: 'AUTOMATICO', color: 'blanco',
    condition: 'USADO', location: 'Córdoba Capital', province: 'cordoba', city: 'Córdoba Capital',
    price: 28900, currency: 'USD', status: 'ACTIVE', isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    description: 'Casi 0km, pocos kilómetros.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 198, contactCount: 10,
  },
  {
    id: '9', sellerId: 's1', sellerName: 'Concesionaria Norte',
    brand: 'Honda', model: 'HR-V', version: 'EXL 1.8 CVT',
    year: 2021, km: 42000, fuelType: 'NAFTA', bodyType: 'SUV', transmission: 'AUTOMATICO', color: 'gris',
    condition: 'USADO', location: 'San Isidro, GBA', province: 'buenosaires', city: 'San Isidro',
    price: 26500, currency: 'USD', status: 'ACTIVE', isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800'],
    description: 'Excelente estado general.', createdAt: new Date().toISOString(),
    hasVTV: true, hasPatenteAlDay: true, viewCount: 167, contactCount: 9,
  },
];

export function Marketplace() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock');

  useEffect(() => {
    const unsub = subscribeToVehicles(
      (data) => {
        // Combinamos los datos reales con los mocks para que no se vea vacío durante desarrollo
        setVehicles([...data, ...MOCK_VEHICLES_FALLBACK]);
        setLoadingVehicles(false);
      },
      () => {
        setVehicles(MOCK_VEHICLES_FALLBACK);
        setLoadingVehicles(false);
      },
    );
    return unsub;
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (!v.brand.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q) && !v.version.toLowerCase().includes(q)) return false;
      }
      if (filters.condition && v.condition !== filters.condition) return false;
      if (filters.bodyType !== 'todos' && v.bodyType && v.bodyType !== filters.bodyType) return false;
      if (filters.brand !== 'todos' && v.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.model !== 'todos' && v.model.toLowerCase() !== filters.model.toLowerCase()) return false;
      if (filters.version !== 'todos' && !v.version.toLowerCase().includes(filters.version.toLowerCase())) return false;
      if (filters.yearFrom && v.year < Number(filters.yearFrom)) return false;
      if (filters.yearTo && v.year > Number(filters.yearTo)) return false;
      if (filters.kmMin && v.km < Number(filters.kmMin)) return false;
      if (filters.kmMax && v.km > Number(filters.kmMax)) return false;
      if (filters.fuelType !== 'todos' && v.fuelType !== filters.fuelType) return false;
      if (filters.transmission !== 'todos' && v.transmission && v.transmission !== filters.transmission) return false;
      if (filters.minPrice && v.price && v.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && v.price && v.price > Number(filters.maxPrice)) return false;
      if (filters.province !== 'todos' && v.province && v.province !== filters.province) return false;
      if (filters.city !== 'todos' && v.city && v.city !== filters.city) return false;
      if (filters.color !== 'todos' && v.color && v.color !== filters.color) return false;
      return true;
    });
  }, [filters, vehicles]);

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const handleRemoveChip = (key: keyof FilterState, resetValue: string | null) => {
    const next = { ...filters, [key]: resetValue };
    if (key === 'brand') { next.model = 'todos'; next.version = 'todos'; }
    if (key === 'model') { next.version = 'todos'; }
    if (key === 'province') { next.city = 'todos'; }
    if (key === 'kmRange') { next.kmMin = ''; next.kmMax = ''; }
    setFilters(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <div className="relative py-12 flex items-center overflow-hidden border-b border-white/5 bg-black/40">
        <div className="container mx-auto relative z-10 px-4 md:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" /> Volver al Inicio
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-primary/20 text-primary border-primary/20 font-bold tracking-tighter px-4 py-1 rounded-full text-xs">
                MARKETPLACE B2B EXCLUSIVO
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
                {activeTab === 'stock' ? (
                  <>STOCK <span className="text-primary">MAYORISTA</span> <br /> Y VERIFICADO</>
                ) : (
                  <>BÚSQUEDAS <span className="text-primary">ACTIVAS</span> <br /> DE COLEGAS</>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-3 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'stock' ? "Buscar marca, modelo..." : "Buscar búsquedas..."}
                  className="h-12 pl-10 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base"
                  value={filters.searchQuery}
                  onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
                />
              </div>
              <Button
                size="lg"
                className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 shrink-0 lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="mt-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-14">
                <TabsTrigger value="stock" className="rounded-xl px-8 font-bold uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Stock Disponible
                </TabsTrigger>
                <TabsTrigger value="wanted" className="rounded-xl px-8 font-bold uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Búsquedas de Colegas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-16">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="stock" className="m-0">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-72 shrink-0">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  resultCount={filteredVehicles.length}
                />
              </aside>

              {/* Results */}
              <div className="flex-1 space-y-6">
                <FilterChips filters={filters} onRemove={handleRemoveChip} onClearAll={clearFilters} />

                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tighter uppercase">
                    Resultados <span className="text-primary ml-2">{filteredVehicles.length}</span>
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ordenar:</span>
                    <Button variant="ghost" size="sm" className="h-10 gap-2 font-bold tracking-tighter uppercase rounded-full hover:bg-white/5">
                      Más recientes
                      <ChevronDown className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>

                {loadingVehicles ? (
                  <div className="flex items-center justify-center py-32 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="font-bold uppercase tracking-widest text-xs">Cargando stock...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredVehicles.map(vehicle => (
                      <div key={vehicle.id}>
                        <VehicleCard vehicle={vehicle} />
                      </div>
                    ))}
                  </div>
                )}

                {filteredVehicles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="bg-white/5 p-8 rounded-full">
                      <Filter className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-tighter">No se encontraron resultados</h3>
                      <p className="text-muted-foreground font-medium">Probá ajustando los filtros para encontrar lo que buscás.</p>
                    </div>
                    <Button onClick={clearFilters} variant="outline" className="rounded-2xl font-bold uppercase tracking-widest text-xs">Limpiar filtros</Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wanted" className="m-0">
            <div className="flex flex-col lg:flex-row gap-12">
              <aside className="hidden lg:block w-72 shrink-0 space-y-8">
                <div className="sticky top-32 space-y-8">
                  <h2 className="text-xl font-bold tracking-tighter uppercase">Filtros Búsquedas</h2>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-tighter">¿Buscás algo específico?</h4>
                      <p className="text-xs text-muted-foreground font-medium">Publicá tu búsqueda y recibí ofertas directas de colegas.</p>
                      <Button className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-3 w-3" /> PUBLICAR BÚSQUEDA
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
              <div className="flex-1 space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tighter uppercase">
                    Búsquedas Activas <span className="text-primary ml-2">{MOCK_WANTED.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {MOCK_WANTED.map(wanted => (
                    <div key={wanted.id} className="p-8 rounded-[2.5rem] bg-card/50 border border-white/5 hover:border-primary/30 transition-all group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={wanted.avatarUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {wanted.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-tighter leading-none">{wanted.userName}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{wanted.companyName}</p>
                          </div>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-bold tracking-tighter px-3 py-1 rounded-full text-[10px]">BUSCANDO</Badge>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold tracking-tighter uppercase">{wanted.brand} {wanted.model}</h3>
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="rounded-full border-white/10 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                            AÑO: {wanted.yearRange.min} - {wanted.yearRange.max}
                          </Badge>
                          <Badge variant="outline" className="rounded-full border-white/10 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                            PRESUPUESTO: {wanted.currency} {wanted.budgetRange.min.toLocaleString()} - {wanted.budgetRange.max.toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">"{wanted.description}"</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Publicado hoy</span>
                        <Button
                          variant="ghost"
                          className="rounded-full h-10 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/10 hover:text-primary"
                          onClick={() => navigate(`/messages?userId=${wanted.userId}&userName=${encodeURIComponent(wanted.userName)}&company=${encodeURIComponent(wanted.companyName)}`)}
                        >
                          <MessageCircle className="h-4 w-4" /> CONTACTAR COLEGA
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[90vw] max-w-sm bg-background border-l border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold tracking-tighter uppercase">Filtros</h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  resultCount={filteredVehicles.length}
                />
              </ScrollArea>
              <div className="p-6 border-t border-white/10">
                <Button className="w-full h-14 rounded-2xl font-bold uppercase tracking-tighter text-lg shadow-xl shadow-primary/20" onClick={() => setShowMobileFilters(false)}>
                  Ver {filteredVehicles.length} resultado{filteredVehicles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
