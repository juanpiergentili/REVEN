import { useState, useEffect, useMemo } from 'react';
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, MessageCircle,
  Plus, X, Loader2, ChevronDown, Check, PackageSearch, Sparkles,
} from 'lucide-react';
import { subscribeToVehicles } from '@/src/lib/vehicles';
import { subscribeToWantedSearches } from '@/src/lib/wantedSearches';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleCard } from '@/src/components/marketplace/VehicleCard';
import { FilterSidebar } from '@/src/components/marketplace/FilterSidebar';
import { FilterChips } from '@/src/components/marketplace/FilterChips';
import { PublishWantedSearch } from '@/src/components/marketplace/PublishWantedSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, WantedSearch } from '@/src/types';
import { useMarketplaceFilters, SORT_OPTIONS, SortOption } from '@/src/hooks/useMarketplaceFilters';


// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center space-y-8"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        <div className="relative bg-card/60 border border-border p-8 rounded-[2rem]">
          <PackageSearch className="h-14 w-14 text-primary mx-auto" strokeWidth={1.5} />
        </div>
      </div>
      <div className="space-y-3 max-w-sm">
        <h3 className="text-2xl font-black tracking-tighter uppercase">Sin resultados</h3>
        <p className="text-muted-foreground font-medium text-sm leading-relaxed">
          No encontramos stock con esos filtros.<br />
          Relajá la búsqueda o limpiá los filtros para ver todo el catálogo.
        </p>
      </div>
      <Button
        onClick={onClear}
        className="rounded-full px-8 h-12 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
      >
        Limpiar filtros
      </Button>
    </motion.div>
  );
}

function EmptyNoData() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center space-y-8"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl scale-150" />
        <div className="relative bg-card/60 border border-border p-8 rounded-[2rem]">
          <Sparkles className="h-14 w-14 text-primary mx-auto" strokeWidth={1.5} />
        </div>
      </div>
      <div className="space-y-3 max-w-sm">
        <h3 className="text-2xl font-black tracking-tighter uppercase">Marketplace activo</h3>
        <p className="text-muted-foreground font-medium text-sm leading-relaxed">
          El stock se actualiza en tiempo real.<br />
          Sos de los primeros en entrar — el catálogo se está cargando.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Conectado en tiempo real
      </div>
    </motion.div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const current = SORT_OPTIONS.find(o => o.value === value)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-10 gap-2 font-bold tracking-tighter uppercase text-xs rounded-full hover:bg-muted border border-border inline-flex items-center px-3 cursor-pointer">
        {current.label}
        <ChevronDown className="h-3.5 w-3.5 text-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[200px]">
        {SORT_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-3 py-2.5 cursor-pointer flex items-center justify-between"
          >
            {opt.label}
            {opt.value === value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Wanted Card ──────────────────────────────────────────────────────────────

function WantedCard({ wanted, onContact }: { wanted: WantedSearch; onContact: () => unknown }) {
  const timeAgo = (() => {
    const diff = Date.now() - new Date(wanted.createdAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-all group flex flex-col h-full"
    >
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

      <div className="space-y-4 flex-1">
        <div>
          <h3 className="text-2xl font-bold tracking-tighter uppercase">
            {wanted.brand} {wanted.model}
          </h3>
          {wanted.version && (
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
              {wanted.version}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-border font-bold text-[10px] uppercase tracking-widest px-3 py-1">
            {wanted.yearRange.min}–{wanted.yearRange.max}
          </Badge>
          <Badge variant="outline" className="rounded-full border-border font-bold text-[10px] uppercase tracking-widest px-3 py-1">
            {wanted.currency} {wanted.budgetRange.min.toLocaleString()} – {wanted.budgetRange.max.toLocaleString()}
          </Badge>
          {wanted.kmApprox && (
            <Badge variant="outline" className="rounded-full border-border font-bold text-[10px] uppercase tracking-widest px-3 py-1">
              ~{wanted.kmApprox.toLocaleString()} km
            </Badge>
          )}
          {wanted.color && (
            <Badge variant="outline" className="rounded-full border-border font-bold text-[10px] uppercase tracking-widest px-3 py-1">
              {wanted.color}
            </Badge>
          )}
          {wanted.conditions.map(c => (
            <Badge key={c} variant="outline" className="rounded-full border-border font-bold text-[10px] uppercase tracking-widest px-3 py-1">
              {c}
            </Badge>
          ))}
        </div>
        {wanted.description && (
          <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
            "{wanted.description}"
          </p>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{timeAgo}</span>
        <Button
          variant="ghost"
          className="rounded-full h-10 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/10 hover:text-primary"
          onClick={onContact}
        >
          <MessageCircle className="h-4 w-4" /> CONTACTAR
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48];

export function Marketplace() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [wantedSearches, setWantedSearches] = useState<WantedSearch[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Lock body scroll while filter drawer is open
  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilters]);
  const [showPublishWanted, setShowPublishWanted] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const navigate = useNavigate();

  const {
    filters, setFilters, sortBy, setSortBy,
    filteredVehicles, filteredWantedSearches, clearFilters, handleRemoveChip,
    activeFilterCount, hasActiveFilters,
  } = useMarketplaceFilters(vehicles, wantedSearches);

  // Vehicles subscription
  useEffect(() => {
    const unsub = subscribeToVehicles(
      (data) => {
        setVehicles(data);
        setLoadingVehicles(false);
      },
      () => {
        setVehicles([]);
        setLoadingVehicles(false);
      },
    );
    return unsub;
  }, []);

  // Wanted searches subscription
  useEffect(() => {
    const unsub = subscribeToWantedSearches(
      (data) => {
        setWantedSearches(data);
      },
    );
    return unsub;
  }, []);


  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / itemsPerPage));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);


  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative py-14 flex items-center overflow-hidden bg-zinc-950">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        {/* Ambient glow */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto relative z-10 px-4 md:px-8">
          <div className="mb-6">
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate('/')}
              className="rounded-full font-bold uppercase tracking-widest text-[10px] gap-2 text-white/50 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Volver al Inicio
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-primary/15 text-primary border border-primary/25 font-bold tracking-tighter px-4 py-1.5 rounded-full text-xs">
                MARKETPLACE B2B EXCLUSIVO
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-none text-white">
                {activeTab === 'stock' ? (
                  <>STOCK <span className="text-primary">MAYORISTA</span><br />Y VERIFICADO</>
                ) : (
                  <>BÚSQUEDAS <span className="text-primary">ACTIVAS</span><br />DE COLEGAS</>
                )}
              </h1>
              <p className="text-sm text-white/40 font-medium max-w-md leading-relaxed">
                {activeTab === 'stock'
                  ? 'Catálogo exclusivo B2B para profesionales del sector automotor.'
                  : 'Publicaciones activas de colegas buscando unidades específicas.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  placeholder="Buscar marca, modelo, versión..."
                  className="h-12 pl-10 rounded-xl bg-white/[0.07] border-white/[0.12] text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/10 transition-all text-base"
                  value={filters.searchQuery}
                  onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
                />
              </div>

              {/* Mobile filter button con badge */}
              <Button
                size="lg"
                variant={activeFilterCount > 0 ? 'default' : 'ghost'}
                className={`relative h-12 w-12 rounded-xl shrink-0 lg:hidden ${activeFilterCount === 0 ? 'border border-white/20 text-white hover:bg-white/10' : ''}`}
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-10">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-white/[0.06] border border-white/[0.10] p-1 rounded-xl h-auto min-h-[3.5rem]">
                <TabsTrigger value="stock" className="flex-1 min-w-0 rounded-xl py-2.5 font-bold uppercase tracking-wide text-xs text-white/50 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25">
                  Stock
                  {!loadingVehicles && (
                    <span className="ml-1.5 text-[10px] opacity-60">({vehicles.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="wanted" className="flex-1 min-w-0 rounded-xl py-2.5 font-bold uppercase tracking-wide text-xs text-white/50 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25">
                  Búsquedas
                  <span className="ml-1.5 text-[10px] opacity-60">({filteredWantedSearches.length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="container mx-auto px-4 md:px-8 py-16">
        <Tabs value={activeTab}>

          {/* ── Stock Tab ── */}
          <TabsContent value="stock" className="m-0">
            <div className="flex flex-col lg:flex-row gap-12">

              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  resultCount={filteredVehicles.length}
                />
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0 space-y-6">
                <FilterChips filters={filters} onRemove={handleRemoveChip} onClearAll={clearFilters} />

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tighter uppercase shrink-0">Resultados</h2>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={filteredVehicles.length}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-primary font-black text-xl sm:text-2xl tracking-tighter shrink-0"
                      >
                        {filteredVehicles.length}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">
                      Ordenar:
                    </span>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                  </div>
                </div>

                {/* Content */}
                {loadingVehicles ? (
                  <div className="flex items-center justify-center py-32 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="font-bold uppercase tracking-widest text-xs">Cargando stock...</span>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  hasActiveFilters
                    ? <EmptyFiltered onClear={clearFilters} />
                    : <EmptyNoData />
                ) : (
                  <>
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {paginatedVehicles.map(vehicle => (
                        <motion.div
                          key={vehicle.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                        >
                          <VehicleCard vehicle={vehicle} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredVehicles.length)} de {filteredVehicles.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {pageNumbers.map((page, i) =>
                          page === '...' ? (
                            <span key={`dots-${i}`} className="px-1 text-muted-foreground font-bold text-xs">…</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-9 w-9 rounded-xl font-bold text-xs ${
                                currentPage === page ? 'shadow-lg shadow-primary/20' : ''
                              }`}
                              onClick={() => setCurrentPage(page as number)}
                            >
                              {page}
                            </Button>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Wanted Tab ── */}
          <TabsContent value="wanted" className="m-0">
            <div className="flex flex-col lg:flex-row gap-12">

              {/* Sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-32 space-y-6">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={setFilters}
                    onClear={clearFilters}
                    resultCount={filteredWantedSearches.length}
                  />
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-tighter">¿Buscás algo específico?</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      Publicá tu búsqueda y recibí ofertas directas de colegas con stock disponible.
                    </p>
                    <Button
                      className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20"
                      onClick={() => setShowPublishWanted(true)}
                    >
                      <Plus className="mr-2 h-3 w-3" /> PUBLICAR BÚSQUEDA
                    </Button>
                  </div>
                </div>
              </aside>

              {/* Cards */}
              <div className="flex-1 min-w-0 space-y-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold tracking-tighter uppercase">Búsquedas Activas</h2>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={filteredWantedSearches.length}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-primary font-black text-2xl tracking-tighter"
                      >
                        {filteredWantedSearches.length}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {/* Mobile CTA */}
                  <Button
                    size="sm"
                    className="lg:hidden rounded-xl font-bold uppercase tracking-widest text-[10px] h-9"
                    onClick={() => setShowPublishWanted(true)}
                  >
                    <Plus className="mr-1.5 h-3 w-3" /> Publicar
                  </Button>
                </div>

                <FilterChips filters={filters} onRemove={handleRemoveChip} onClearAll={clearFilters} />

                {filteredWantedSearches.length === 0 ? (
                  hasActiveFilters
                    ? <EmptyFiltered onClear={clearFilters} />
                    : <EmptyNoData />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWantedSearches.map((wanted: WantedSearch) => (
                      <div key={wanted.id}>
                        <WantedCard
                          wanted={wanted}
                          onContact={() => {
                            navigate(`/messages?userId=${wanted.userId}&userName=${encodeURIComponent(wanted.userName)}&company=${encodeURIComponent(wanted.companyName)}&wantedId=${wanted.id}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Publish Wanted Search Drawer ── */}
      <PublishWantedSearch
        open={showPublishWanted}
        onClose={() => setShowPublishWanted(false)}
      />

      {/* ── Mobile Filters Drawer ── */}
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
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 h-dvh w-[90vw] max-w-sm bg-background border-l border-border z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold tracking-tighter uppercase">Filtros</h2>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Sort inside drawer on mobile */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ordenar por</span>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  resultCount={activeTab === 'stock' ? filteredVehicles.length : filteredWantedSearches.length}
                />
              </div>

              {/* Drawer footer */}
              {(() => {
                const count = activeTab === 'stock' ? filteredVehicles.length : filteredWantedSearches.length;
                return (
                  <div className="p-6 border-t border-border space-y-3">
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-xs text-muted-foreground"
                        onClick={() => { clearFilters(); }}
                      >
                        Limpiar {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
                      </Button>
                    )}
                    <Button
                      className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20 gap-2"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      Ver <span className="font-black text-base">{count}</span> resultado{count !== 1 ? 's' : ''}
                    </Button>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
