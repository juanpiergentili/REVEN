
import { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronDown, ChevronLeft, User, Building2, MessageCircle, Plus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/src/components/marketplace/VehicleCard';
import { Vehicle, WantedSearch } from '@/src/types';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MOCK_WANTED: WantedSearch[] = [
  {
    id: 'w1',
    userId: 'u1',
    userName: 'Marcos Galarza',
    companyName: 'Galarza Trucks',
    brand: 'Toyota',
    model: 'Hilux',
    yearRange: { min: 2020, max: 2024 },
    budgetRange: { min: 35000, max: 45000 },
    currency: 'USD',
    description: 'Busco Hilux SRX 4x4, pocos km, color blanco o gris plata.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w2',
    userId: 'u2',
    userName: 'Marina Soler',
    companyName: 'LuxCars',
    brand: 'Volkswagen',
    model: 'Amarok',
    yearRange: { min: 2022, max: 2024 },
    budgetRange: { min: 40000, max: 55000 },
    currency: 'USD',
    description: 'Necesito Amarok V6 para cliente directo. Pago contado.',
    createdAt: new Date().toISOString(),
  }
];

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    sellerId: 's1',
    sellerName: 'Concesionaria Norte',
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
    status: 'ACTIVE',
    isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800'],
    description: 'Impecable estado, único dueño.',
    createdAt: new Date().toISOString(),
    isInspected: true,
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '2',
    sellerId: 's2',
    sellerName: 'Sport Cars',
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
    status: 'ACTIVE',
    isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    description: 'Entrega inmediata. Varios colores.',
    createdAt: new Date().toISOString(),
    isInspected: true,
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '3',
    sellerId: 's3',
    sellerName: 'Auto Premium',
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
    status: 'ACTIVE',
    isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800'],
    description: 'El más vendido del país.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '4',
    sellerId: 's1',
    sellerName: 'Concesionaria Norte',
    brand: 'Peugeot',
    model: '208',
    version: 'Feline 1.6 AT',
    year: 2022,
    km: 28000,
    fuelType: 'NAFTA',
    condition: 'USADO',
    location: 'San Isidro, GBA',
    price: 19500,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800'],
    description: 'Service oficiales al día.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '5',
    sellerId: 's4',
    sellerName: 'Mundo Autos',
    brand: 'Ford',
    model: 'Ranger',
    version: 'V6 Limited Plus 4x4',
    year: 2024,
    km: 0,
    fuelType: 'DIESEL',
    condition: '0KM',
    location: 'Cordoba Capital',
    price: 62000,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'],
    description: 'Nueva generación, tope de gama.',
    createdAt: new Date().toISOString(),
    isInspected: true,
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '6',
    sellerId: 's2',
    sellerName: 'Sport Cars',
    brand: 'Renault',
    model: 'Alaskan',
    version: 'Iconic 4x4 AT',
    year: 2021,
    km: 45000,
    fuelType: 'DIESEL',
    condition: 'USADO',
    location: 'Palermo, CABA',
    price: 32000,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'],
    description: 'Excelente unidad, fabricada en Argentina.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '7',
    sellerId: 's3',
    sellerName: 'Auto Premium',
    brand: 'Jeep',
    model: 'Compass',
    version: 'Limited 1.3T AT',
    year: 2023,
    km: 8000,
    fuelType: 'NAFTA',
    condition: 'USADO',
    location: 'Pilar, GBA',
    price: 38500,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: true,
    photos: ['https://images.unsplash.com/photo-1611016186353-9af58c69a533?auto=format&fit=crop&q=80&w=800'],
    description: 'Tope de gama, impecable.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '8',
    sellerId: 's4',
    sellerName: 'Mundo Autos',
    brand: 'Chevrolet',
    model: 'S10',
    version: 'High Country 4x4 AT',
    year: 2022,
    km: 35000,
    fuelType: 'DIESEL',
    condition: 'USADO',
    location: 'Cordoba Capital',
    price: 35900,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    description: 'Service oficiales, lista para trabajar.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
  {
    id: '9',
    sellerId: 's1',
    sellerName: 'Concesionaria Norte',
    brand: 'Honda',
    model: 'HR-V',
    version: 'EXL 1.8 CVT',
    year: 2021,
    km: 42000,
    fuelType: 'NAFTA',
    condition: 'USADO',
    location: 'San Isidro, GBA',
    price: 26500,
    currency: 'USD',
    status: 'ACTIVE',
    isFeatured: false,
    photos: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800'],
    description: 'Excelente estado general.',
    createdAt: new Date().toISOString(),
    hasVTV: true,
    hasPatenteAlDay: true,
  },
];

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [condition, setCondition] = useState<string | null>(null);
  const [brand, setBrand] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const navigate = useNavigate();

  const filteredVehicles = MOCK_VEHICLES.filter(vehicle => {
    const matchesSearch = 
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.version.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCondition = !condition || vehicle.condition === condition;
    
    const matchesBrand = brand === 'all' || vehicle.brand.toLowerCase() === brand.toLowerCase();
    
    const matchesLocation = locationFilter === 'all' || 
      vehicle.location.toLowerCase().includes(locationFilter.toLowerCase());

    const price = vehicle.price;
    const matchesMinPrice = !minPrice || price >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || price <= Number(maxPrice);

    return matchesSearch && matchesCondition && matchesBrand && matchesLocation && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCondition(null);
    setBrand('all');
    setLocationFilter('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section - Shrunk */}
      <div className="relative py-12 flex items-center overflow-hidden border-b border-white/5 bg-black/40">
        <div className="container relative z-10 px-4 md:px-8 mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al Inicio
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
                  placeholder={activeTab === 'stock' ? "Buscar unidad..." : "Buscar búsquedas..."}
                  className="h-12 pl-10 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 shrink-0">
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

      <main className="container px-4 md:px-8 py-16 mx-auto">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="stock" className="m-0">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Sidebar Filters */}
              <aside className="hidden lg:block w-72 shrink-0 space-y-8">
                <div className="sticky top-32 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tighter uppercase">Filtros</h2>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs font-bold uppercase tracking-widest text-primary"
                      onClick={clearFilters}
                    >
                      Limpiar
                    </Button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Condición</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className={`rounded-2xl border-white/5 font-bold text-xs transition-all ${condition === '0KM' ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 hover:border-primary/50'}`}
                          onClick={() => setCondition(condition === '0KM' ? null : '0KM')}
                        >
                          0KM
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`rounded-2xl border-white/5 font-bold text-xs transition-all ${condition === 'USADO' ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 hover:border-primary/50'}`}
                          onClick={() => setCondition(condition === 'USADO' ? null : 'USADO')}
                        >
                          USADO
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Marca</label>
                      <Select value={brand} onValueChange={setBrand}>
                        <SelectTrigger className="rounded-2xl bg-white/5 border-white/10 h-12 font-bold">
                          <SelectValue placeholder="Todas las marcas" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="toyota">Toyota</SelectItem>
                          <SelectItem value="volkswagen">Volkswagen</SelectItem>
                          <SelectItem value="ford">Ford</SelectItem>
                          <SelectItem value="fiat">Fiat</SelectItem>
                          <SelectItem value="peugeot">Peugeot</SelectItem>
                          <SelectItem value="renault">Renault</SelectItem>
                          <SelectItem value="jeep">Jeep</SelectItem>
                          <SelectItem value="chevrolet">Chevrolet</SelectItem>
                          <SelectItem value="honda">Honda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Rango de Precio (USD)</label>
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Min" 
                          className="h-12 rounded-2xl bg-white/5 border-white/10 font-bold" 
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          type="number"
                        />
                        <Input 
                          placeholder="Max" 
                          className="h-12 rounded-2xl bg-white/5 border-white/10 font-bold" 
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          type="number"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Localidad</label>
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="rounded-2xl bg-white/5 border-white/10 h-12 font-bold">
                          <SelectValue placeholder="Todas las zonas" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="caba">CABA</SelectItem>
                          <SelectItem value="gba">GBA</SelectItem>
                          <SelectItem value="cordoba">Córdoba</SelectItem>
                          <SelectItem value="santa fe">Santa Fe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Vehicle Grid */}
              <div className="flex-1 space-y-10">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
                
                {filteredVehicles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="bg-white/5 p-8 rounded-full">
                      <Filter className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-tighter">No se encontraron resultados</h3>
                      <p className="text-muted-foreground font-medium">Probá ajustando los filtros para encontrar lo que buscás.</p>
                    </div>
                    <Button onClick={clearFilters} variant="outline" className="rounded-2xl font-bold uppercase tracking-widest text-xs">
                      Limpiar filtros
                    </Button>
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
                        <Plus className="mr-2 h-3 w-3" />
                        PUBLICAR BÚSQUEDA
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
                  {MOCK_WANTED.map((wanted) => (
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
                        <Badge className="bg-primary/10 text-primary border-none font-bold tracking-tighter px-3 py-1 rounded-full text-[10px]">
                          BUSCANDO
                        </Badge>
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
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                          "{wanted.description}"
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Publicado hoy</span>
                        <Button variant="ghost" className="rounded-full h-10 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/10 hover:text-primary">
                          <MessageCircle className="h-4 w-4" />
                          CONTACTAR COLEGA
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
    </div>
  );
}
