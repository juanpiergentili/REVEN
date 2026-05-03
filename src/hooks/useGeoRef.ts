import { useState, useEffect } from 'react';

export interface GeoItem {
  id: string;
  nombre: string;
}

export function useGeoRef(provinciaId?: string) {
  const [provincias, setProvincias] = useState<GeoItem[]>([]);
  const [localidades, setLocalidades] = useState<GeoItem[]>([]);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  // Fetch Provinces
  useEffect(() => {
    setLoadingProvincias(true);
    fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100')
      .then(res => res.json())
      .then(data => {
        if (data.provincias) {
          const sorted = data.provincias.sort((a: GeoItem, b: GeoItem) => a.nombre.localeCompare(b.nombre));
          setProvincias(sorted);
        }
      })
      .catch(err => console.error('Error fetching provincias:', err))
      .finally(() => setLoadingProvincias(false));
  }, []);

  // Fetch Localidades based on selected provincia
  useEffect(() => {
    if (!provinciaId) {
      setLocalidades([]);
      return;
    }

    setLoadingLocalidades(true);
    fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinciaId}&campos=id,nombre&max=1000`)
      .then(res => res.json())
      .then(data => {
        if (data.localidades) {
          const sorted = data.localidades.sort((a: GeoItem, b: GeoItem) => a.nombre.localeCompare(b.nombre));
          setLocalidades(sorted);
        }
      })
      .catch(err => console.error('Error fetching localidades:', err))
      .finally(() => setLoadingLocalidades(false));
  }, [provinciaId]);

  return { provincias, localidades, loadingProvincias, loadingLocalidades };
}

export async function fetchProvinciaName(id: string): Promise<string> {
  if (!id) return '';
  try {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/provincias?id=${id}&campos=nombre`);
    const data = await res.json();
    return data.provincias?.[0]?.nombre || id;
  } catch {
    return id;
  }
}

export async function fetchLocalidadName(id: string): Promise<string> {
  if (!id) return '';
  try {
    const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?id=${id}&campos=nombre`);
    const data = await res.json();
    return data.localidades?.[0]?.nombre || id;
  } catch {
    return id;
  }
}
