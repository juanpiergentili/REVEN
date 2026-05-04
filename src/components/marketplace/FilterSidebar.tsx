import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, KM_RANGES, COLORS, getYearRange } from '@/src/data/vehicle-catalog';
import { useArgAutos } from '@/src/hooks/useArgAutos';
import { useGeoRef } from '@/src/hooks/useGeoRef';

export interface FilterState {
  searchQuery: string;
  condition: string | null;
  bodyType: string;
  brand: string;
  model: string;
  version: string;
  yearFrom: string;
  yearTo: string;
  kmRange: string;
  kmMin: string;
  kmMax: string;
  fuelType: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  province: string;
  city: string;
  color: string;
}

export const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  condition: null,
  bodyType: 'todos',
  brand: 'todos',
  model: 'todos',
  version: 'todos',
  yearFrom: '',
  yearTo: '',
  kmRange: 'todos',
  kmMin: '',
  kmMax: '',
  fuelType: 'todos',
  transmission: 'todos',
  minPrice: '',
  maxPrice: '',
  currency: 'USD',
  province: 'todos',
  city: 'todos',
  color: 'todos',
};

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
  resultCount: number;
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground cursor-pointer">{title}</label>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onFilterChange, onClear, resultCount }: FilterSidebarProps) {
  const { brands, models, versions, loadingVersions } = useArgAutos(
    filters.brand !== 'todos' ? filters.brand : undefined,
    filters.model !== 'todos' ? filters.model : undefined
  );
  const { provincias, localidades } = useGeoRef(
    filters.province !== 'todos' ? filters.province : undefined
  );

  const update = (key: keyof FilterState, value: string | null) => {
    const next = { ...filters, [key]: value };
    // Reset dependents
    if (key === 'brand') { next.model = 'todos'; next.version = 'todos'; }
    if (key === 'model') { next.version = 'todos'; }
    if (key === 'province') { next.city = 'todos'; }
    if (key === 'kmRange' && value !== 'todos' && value !== 'custom') {
      const range = KM_RANGES.find(r => r.value === value);
      if (range) { next.kmMin = String(range.min); next.kmMax = String(range.max); }
    }
    if (key === 'kmRange' && value === 'todos') { next.kmMin = ''; next.kmMax = ''; }
    onFilterChange(next);
  };

  const years = getYearRange();

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
    if (key === 'searchQuery') return false;
    if (key === 'currency') return false;
    if (val === null || val === 'todos' || val === '') return false;
    return true;
  });

  return (
    <div className="lg:sticky lg:top-32 flex flex-col h-full lg:h-[calc(100vh-10rem)]">
      <div className="shrink-0 space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tighter uppercase">Filtros</h2>
          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs font-bold uppercase tracking-widest text-primary"
              onClick={onClear}
            >
              Limpiar
            </Button>
          )}
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {resultCount} resultado{resultCount !== 1 ? 's' : ''}
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-6 pb-12">
        {/* Condición */}
        <FilterSection title="Condición">
          <div className="grid grid-cols-2 gap-2">
            {['0KM', 'USADO'].map(c => (
              <Button
                key={c}
                variant="outline"
                className={`rounded-xl font-bold text-xs transition-all ${filters.condition === c ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/40 hover:text-foreground'}`}
                onClick={() => update('condition', filters.condition === c ? null : c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </FilterSection>

        {/* Tipo de vehículo */}
        <FilterSection title="Tipo de Vehículo">
          <Select value={filters.bodyType} onValueChange={v => update('bodyType', v)}>
            <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos</SelectItem>
              {BODY_TYPES.map(bt => (
                <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>

        {/* Marca */}
        <FilterSection title="Marca">
          <Select value={filters.brand} onValueChange={v => update('brand', v)}>
            <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value="todos">Todas</SelectItem>
              {brands.map(b => (
                <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>

        {/* Modelo */}
        {filters.brand !== 'todos' && models.length > 0 && (
          <FilterSection title="Modelo">
            <Select value={filters.model} onValueChange={v => update('model', v)}>
              <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
                <SelectValue placeholder="Todos los modelos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="todos">Todos</SelectItem>
                {models.map(m => (
                  <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>
        )}

        {/* Versión */}
        {filters.model !== 'todos' && (
          <FilterSection title="Versión">
            <Select
              value={filters.version}
              onValueChange={v => update('version', v)}
              disabled={loadingVersions}
            >
              <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
                <SelectValue placeholder={loadingVersions ? 'Cargando versiones...' : 'Todas las versiones'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="todos">Todas</SelectItem>
                {versions.map(vr => (
                  <SelectItem key={vr.name} value={vr.name}>{vr.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingVersions && versions.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 font-medium text-center pt-1">
                Sin versiones disponibles
              </p>
            )}
          </FilterSection>
        )}

        {/* Año */}
        <FilterSection title="Año" defaultOpen={false}>
          <div className="flex gap-2">
            <Select value={filters.yearFrom} onValueChange={v => update('yearFrom', v)}>
              <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
                <SelectValue placeholder="Desde" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-52">
                <SelectItem value="">Desde</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.yearTo} onValueChange={v => update('yearTo', v)}>
              <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
                <SelectValue placeholder="Hasta" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-52">
                <SelectItem value="">Hasta</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FilterSection>

        {/* Kilometraje */}
        <FilterSection title="Kilometraje" defaultOpen={false}>
          <Select value={filters.kmRange} onValueChange={v => update('kmRange', v)}>
            <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos</SelectItem>
              {KM_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {filters.kmRange === 'custom' && (
            <div className="flex gap-2 mt-2">
              <Input placeholder="Min" className="h-11 rounded-xl bg-muted border-border font-bold text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all" value={filters.kmMin} onChange={e => update('kmMin', e.target.value)} type="number" />
              <Input placeholder="Max" className="h-11 rounded-xl bg-muted border-border font-bold text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all" value={filters.kmMax} onChange={e => update('kmMax', e.target.value)} type="number" />
            </div>
          )}
        </FilterSection>

        {/* Combustible */}
        <FilterSection title="Combustible" defaultOpen={false}>
          <Select value={filters.fuelType} onValueChange={v => update('fuelType', v)}>
            <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos</SelectItem>
              {FUEL_TYPES.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>

        {/* Transmisión */}
        <FilterSection title="Transmisión" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {TRANSMISSIONS.map(t => (
              <Button
                key={t.value}
                variant="outline"
                className={`rounded-xl font-bold text-xs transition-all ${filters.transmission === t.value ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/40 hover:text-foreground'}`}
                onClick={() => update('transmission', filters.transmission === t.value ? 'todos' : t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </FilterSection>

        {/* Precio */}
        <FilterSection title="Precio">
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl text-[10px] font-bold flex-1 transition-all ${filters.currency === 'USD' ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/40 hover:text-foreground'}`}
              onClick={() => update('currency', 'USD')}
            >USD</Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl text-[10px] font-bold flex-1 transition-all ${filters.currency === 'ARS' ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/40 hover:text-foreground'}`}
              onClick={() => update('currency', 'ARS')}
            >ARS</Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Min" className="h-11 rounded-xl bg-muted border-border font-bold text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all" value={filters.minPrice} onChange={e => update('minPrice', e.target.value)} type="number" />
            <Input placeholder="Max" className="h-11 rounded-xl bg-muted border-border font-bold text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all" value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)} type="number" />
          </div>
        </FilterSection>

        {/* Ubicación */}
        <FilterSection title="Ubicación">
          <Select value={filters.province} onValueChange={v => update('province', v)}>
            <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all">
              <span className="truncate">
                {filters.province === 'todos'
                  ? 'Toda Argentina'
                  : provincias.find(p => String(p.id) === String(filters.province))?.nombre ?? filters.province}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value="todos">Toda Argentina</SelectItem>
              {provincias.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.province !== 'todos' && localidades.length > 0 && (
            <Select value={filters.city} onValueChange={v => update('city', v)}>
              <SelectTrigger className="rounded-xl bg-muted border-border h-11 font-bold text-sm text-foreground hover:border-primary/40 transition-all mt-2">
                <span className="truncate">
                  {filters.city === 'todos' ? 'Toda la provincia' : filters.city}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="todos">Toda la provincia</SelectItem>
                {localidades.map(l => (
                  <SelectItem key={l.id} value={l.nombre}>{l.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FilterSection>

        {/* Color */}
        <FilterSection title="Color" defaultOpen={false}>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => update('color', filters.color === c.value ? 'todos' : c.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${filters.color === c.value ? 'bg-primary/10 border border-primary' : 'hover:bg-muted border border-transparent'}`}
                title={c.label}
              >
                <div
                  className="h-6 w-6 rounded-full border border-border shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground truncate w-full text-center">{c.label.split('/')[0]}</span>
              </button>
            ))}
          </div>
        </FilterSection>
        </div>
      </ScrollArea>
    </div>
  );
}
