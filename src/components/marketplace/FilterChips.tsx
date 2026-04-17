import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterState, INITIAL_FILTERS } from './FilterSidebar';

interface FilterChipsProps {
  filters: FilterState;
  onRemove: (key: keyof FilterState, resetValue: string | null) => void;
  onClearAll: () => void;
}

const LABELS: Partial<Record<keyof FilterState, string>> = {
  condition: 'Condición',
  bodyType: 'Tipo',
  brand: 'Marca',
  model: 'Modelo',
  version: 'Versión',
  yearFrom: 'Año desde',
  yearTo: 'Año hasta',
  kmRange: 'Kilometraje',
  fuelType: 'Combustible',
  transmission: 'Transmisión',
  minPrice: 'Precio mín',
  maxPrice: 'Precio máx',
  province: 'Provincia',
  city: 'Ciudad',
  color: 'Color',
};

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  const chips: { key: keyof FilterState; label: string; value: string; resetValue: string | null }[] = [];

  const add = (key: keyof FilterState, value: string, resetValue: string | null = 'all') => {
    if (value && value !== 'all' && value !== '') {
      chips.push({ key, label: LABELS[key] || key, value, resetValue });
    }
  };

  if (filters.condition) add('condition', filters.condition, null);
  add('bodyType', filters.bodyType);
  add('brand', filters.brand);
  add('model', filters.model);
  add('version', filters.version);
  if (filters.yearFrom) add('yearFrom', filters.yearFrom, '');
  if (filters.yearTo) add('yearTo', filters.yearTo, '');
  if (filters.kmRange !== 'all') add('kmRange', filters.kmRange === 'custom' ? 'Personalizado' : filters.kmRange);
  add('fuelType', filters.fuelType);
  if (filters.transmission !== 'all') add('transmission', filters.transmission === 'MANUAL' ? 'Manual' : 'Automática');
  if (filters.minPrice) add('minPrice', `${filters.currency} ${Number(filters.minPrice).toLocaleString()}`, '');
  if (filters.maxPrice) add('maxPrice', `${filters.currency} ${Number(filters.maxPrice).toLocaleString()}`, '');
  add('province', filters.province);
  add('city', filters.city);
  add('color', filters.color);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {chips.map(chip => (
        <Badge
          key={chip.key}
          variant="outline"
          className="rounded-full border-primary/30 bg-primary/5 text-primary font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => onRemove(chip.key, chip.resetValue)}
        >
          <span className="text-muted-foreground mr-0.5">{chip.label}:</span>
          {chip.value}
          <X className="h-3 w-3 ml-0.5" />
        </Badge>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:underline ml-2"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
