import { useState, useEffect } from 'react';
import { ARG_PROVINCES, TOP_CITIES } from '../data/static-db';

export interface GeoItem {
  id: string;
  nombre: string;
}

export function useGeoRef(provinciaId?: string) {
  const [provincias, setProvincias] = useState<GeoItem[]>(
    ARG_PROVINCES.map(p => ({ id: p.id, nombre: p.name }))
  );
  const [localidades, setLocalidades] = useState<GeoItem[]>([]);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  // Fetch Provinces (Fallback to static)
  useEffect(() => {
    setLoadingProvincias(true);
    fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100')
      .then(res => res.json())
      .then(data => {
        if (data.provincias && data.provincias.length > 0) {
          const sorted = data.provincias.sort((a: GeoItem, b: GeoItem) => a.nombre.localeCompare(b.nombre));
          setProvincias(sorted);
        }
      })
      .catch(() => {
        // Already initialized with static data
      })
      .finally(() => setLoadingProvincias(false));
  }, []);

  // Fetch Localidades (Fallback to static top cities)
  useEffect(() => {
    if (!provinciaId) {
      setLocalidades([]);
      return;
    }

    setLoadingLocalidades(true);
    fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinciaId}&campos=id,nombre&max=2000`)
      .then(res => res.json())
      .then(data => {
        if (data.localidades && data.localidades.length > 0) {
          const sorted = data.localidades.sort((a: GeoItem, b: GeoItem) => a.nombre.localeCompare(b.nombre));
          setLocalidades(sorted);
        } else {
          throw new Error('Empty');
        }
      })
      .catch(() => {
        const staticCities = TOP_CITIES[provinciaId] || [];
        setLocalidades(staticCities.map(c => ({ id: c.id, nombre: c.name })));
      })
      .finally(() => setLoadingLocalidades(false));
  }, [provinciaId]);

  return { provincias, localidades, loadingProvincias, loadingLocalidades };
}

export async function fetchProvinciaName(id: string): Promise<string> {
  if (!id) return '';
  const staticFound = ARG_PROVINCES.find(p => p.id === id);
  if (staticFound) return staticFound.name;
  return id;
}
