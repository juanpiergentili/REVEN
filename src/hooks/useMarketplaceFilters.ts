import { useState, useMemo, useCallback } from 'react';
import type { Vehicle } from '../types';
import { FilterState, INITIAL_FILTERS } from '../components/marketplace/FilterSidebar';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'km_asc' | 'year_desc' | 'year_asc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Más recientes'      },
  { value: 'price_asc',  label: 'Menor precio'        },
  { value: 'price_desc', label: 'Mayor precio'        },
  { value: 'km_asc',     label: 'Menor kilometraje'   },
  { value: 'year_desc',  label: 'Mayor año primero'   },
  { value: 'year_asc',   label: 'Menor año primero'   },
];

function filterVehicles(vehicles: Vehicle[], filters: FilterState): Vehicle[] {
  return vehicles.filter(v => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const hit = v.brand.toLowerCase().includes(q)
                || v.model.toLowerCase().includes(q)
                || v.version.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (filters.condition && v.condition !== filters.condition) return false;
    if (filters.bodyType !== 'todos' && v.bodyType !== filters.bodyType) return false;
    if (filters.brand !== 'todos' && v.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
    if (filters.model !== 'todos' && v.model.toLowerCase() !== filters.model.toLowerCase()) return false;
    if (filters.version !== 'todos' && !v.version.toLowerCase().includes(filters.version.toLowerCase())) return false;
    if (filters.yearFrom && v.year < Number(filters.yearFrom)) return false;
    if (filters.yearTo && v.year > Number(filters.yearTo)) return false;
    if (filters.kmMin && v.km < Number(filters.kmMin)) return false;
    if (filters.kmMax && v.km > Number(filters.kmMax)) return false;
    if (filters.fuelType !== 'todos' && v.fuelType !== filters.fuelType) return false;
    if (filters.transmission !== 'todos' && v.transmission !== filters.transmission) return false;
    if (filters.minPrice && v.price !== undefined && v.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && v.price !== undefined && v.price > Number(filters.maxPrice)) return false;
    if (filters.province !== 'todos' && v.province !== filters.province) return false;
    if (filters.city !== 'todos' && v.city !== filters.city) return false;
    if (filters.color !== 'todos' && v.color !== filters.color) return false;
    return true;
  });
}

function sortVehicles(vehicles: Vehicle[], sortBy: SortOption): Vehicle[] {
  return [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price_asc':
        if (a.price === undefined) return 1;
        if (b.price === undefined) return -1;
        return a.price - b.price;
      case 'price_desc':
        if (a.price === undefined) return 1;
        if (b.price === undefined) return -1;
        return b.price - a.price;
      case 'km_asc':
        return a.km - b.km;
      case 'year_desc':
        return b.year - a.year;
      case 'year_asc':
        return a.year - b.year;
    }
  });
}

export function useMarketplaceFilters(vehicles: Vehicle[]) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredVehicles = useMemo(
    () => sortVehicles(filterVehicles(vehicles, filters), sortBy),
    [vehicles, filters, sortBy],
  );

  const clearFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const handleRemoveChip = useCallback((key: keyof FilterState, resetValue: string | null) => {
    setFilters(prev => {
      const next = { ...prev, [key]: resetValue };
      if (key === 'brand')    { next.model = 'todos'; next.version = 'todos'; }
      if (key === 'model')    { next.version = 'todos'; }
      if (key === 'province') { next.city = 'todos'; }
      if (key === 'kmRange')  { next.kmMin = '';  next.kmMax = ''; }
      return next;
    });
  }, []);

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([key, val]) => {
      if (key === 'searchQuery' || key === 'currency' || key === 'kmMin' || key === 'kmMax') return false;
      return val !== null && val !== 'todos' && val !== '';
    }).length,
    [filters],
  );

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters, setFilters,
    sortBy, setSortBy,
    filteredVehicles,
    clearFilters,
    handleRemoveChip,
    activeFilterCount,
    hasActiveFilters,
  };
}
