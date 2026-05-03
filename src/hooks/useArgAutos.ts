import { useState, useEffect } from 'react';
import { ARG_BRANDS, EXPANDED_MODELS } from '../data/static-db';

const BASE_URL = 'https://argautos.com/api/v1';

export type Brand = { id: number; name: string; slug: string };
export type AutoModel = { id: number; name: string; slug: string; brand_id: number };
export type Version = { id: number; name: string; slug: string; model_id: number };
export type Valuation = { id: number; year: number; price: string; currency: string };

// Convert static string array to Brand object array
const STATIC_BRANDS: Brand[] = ARG_BRANDS.map((name, i) => ({
  id: i + 5000,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-')
}));

export function useArgAutos(selectedBrandName?: string, selectedModelName?: string, selectedVersionName?: string) {
  const [brands, setBrands] = useState<Brand[]>(STATIC_BRANDS);
  const [models, setModels] = useState<AutoModel[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingValuations, setLoadingValuations] = useState(false);

  // 1. Fetch Brands (Fallback to Static)
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const res = await fetch(`${BASE_URL}/brands?per_page=1000`);
        const d = await res.json();
        if (d.data && d.data.length > 0) {
          const sorted = d.data.sort((a: Brand, b: Brand) => a.name.localeCompare(b.name));
          setBrands(sorted);
        } else {
          setBrands(STATIC_BRANDS);
        }
      } catch (e) {
        setBrands(STATIC_BRANDS);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Resolve IDs
  const selectedBrand = brands.find(b => b.name === selectedBrandName);
  const selectedBrandId = selectedBrand?.id;
  
  const selectedModelId = models.find(m => m.name === selectedModelName)?.id;
  const selectedVersionId = versions.find(v => v.name === selectedVersionName)?.id;

  // 2. Fetch Models
  useEffect(() => {
    if (!selectedBrandName) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      
      // Try API first if we have a real ID (< 5000)
      if (selectedBrandId && selectedBrandId < 5000) {
        try {
          const res = await fetch(`${BASE_URL}/brands/${selectedBrandId}/models?per_page=1000`);
          const d = await res.json();
          if (d.data && d.data.length > 0) {
            setModels(d.data.sort((a: AutoModel, b: AutoModel) => a.name.localeCompare(b.name)));
            setLoadingModels(false);
            return;
          }
        } catch (e) {
          console.warn('API error fetching models, using static fallback');
        }
      }

      // Fallback to static DB
      const staticModels = EXPANDED_MODELS[selectedBrandName.toUpperCase()] || [];
      if (staticModels.length > 0) {
        setModels(staticModels.map((name, i) => ({
          id: i + 10000,
          name,
          slug: name.toLowerCase(),
          brand_id: selectedBrandId || 0
        })));
      } else {
        setModels([]);
      }
      setLoadingModels(false);
    };
    fetchModels();
  }, [selectedBrandId, selectedBrandName]);

  // 3. Fetch Versions
  useEffect(() => {
    if (!selectedModelId || selectedModelId >= 10000) {
      setVersions([]);
      return;
    }

    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const res = await fetch(`${BASE_URL}/models/${selectedModelId}/versions?per_page=1000`);
        const d = await res.json();
        if (d.data) {
          setVersions(d.data.sort((a: Version, b: Version) => a.name.localeCompare(b.name)));
        }
      } catch (e) {
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [selectedModelId]);

  // 4. Fetch Valuations (ACARA)
  useEffect(() => {
    if (!selectedVersionId || selectedVersionId >= 10000) {
      setValuations([]);
      return;
    }
    setLoadingValuations(true);
    fetch(`${BASE_URL}/versions/${selectedVersionId}/valuations?currency=ars&sources=acara`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setValuations(d.data);
      })
      .catch(() => setValuations([]))
      .finally(() => setLoadingValuations(false));
  }, [selectedVersionId]);

  return { brands, models, versions, valuations, loadingBrands, loadingModels, loadingVersions, loadingValuations };
}
