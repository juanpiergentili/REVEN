import { useState, useEffect } from 'react';
import { ARG_BRANDS, EXPANDED_MODELS } from '../data/static-db';

const BASE_URL = 'https://argautos.com/api/v1';

export type Brand = { id: number; name: string; slug: string };
export type AutoModel = { id: number; name: string; slug: string; brand_id: number };
export type Version = { id: number; name: string; slug: string; model_id: number };
export type Valuation = { 
  id: number; 
  year: number; 
  price: string; 
  currency: string; 
  acara_price?: string | null;
  infoauto_price?: string | null;
};

const STATIC_BRANDS: Brand[] = ARG_BRANDS.map((name, i) => ({
  id: i + 5000,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-')
}));

export function useArgAutos(
  selectedBrandName?: string, 
  selectedModelName?: string, 
  selectedVersionName?: string,
  selectedYear?: string | number
) {
  const [brands, setBrands] = useState<Brand[]>(STATIC_BRANDS);
  const [models, setModels] = useState<AutoModel[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  // 1. Fetch Brands (Fallback to Static)
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const res = await fetch(`${BASE_URL}/brands?per_page=100`);
        const d = await res.json();
        if (d.data && d.data.length > 0) {
          const normalized = d.data
            .map((b: Brand) => ({ ...b, name: b.name.toUpperCase() }))
            .sort((a: Brand, b: Brand) => a.name.localeCompare(b.name));
          setBrands(normalized);
        } else {
          setBrands(STATIC_BRANDS);
        }
      } catch {
        setBrands(STATIC_BRANDS);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Resolve IDs from current brands/models arrays
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
      if (selectedBrandId && selectedBrandId < 5000) {
        try {
          const res = await fetch(`${BASE_URL}/brands/${selectedBrandId}/models?per_page=100`);
          const d = await res.json();
          if (d.data && d.data.length > 0) {
            setModels(d.data
              .map((m: AutoModel) => ({ ...m, name: m.name.toUpperCase() }))
              .sort((a: AutoModel, b: AutoModel) => a.name.localeCompare(b.name)));
            setLoadingModels(false);
            return;
          }
        } catch {
          console.warn('API error fetching models, using static fallback');
        }
      }

      const staticModels = EXPANDED_MODELS[selectedBrandName.toUpperCase()] || [];
      setModels(staticModels.map((name, i) => ({
        id: i + 10000,
        name,
        slug: name.toLowerCase(),
        brand_id: selectedBrandId || 0,
      })));
      setLoadingModels(false);
    };

    fetchModels();
  }, [selectedBrandId, selectedBrandName]);

  // 3. Fetch Versions (Depends on Model + Year)
  useEffect(() => {
    if (!selectedModelName) {
      setVersions([]);
      return;
    }

    let cancelled = false;

    const fetchVersions = async () => {
      setLoadingVersions(true);

      try {
        let modelApiId: number | null = null;
        if (selectedModelId && selectedModelId < 10000) {
          modelApiId = selectedModelId;
        } else if (selectedBrandId && selectedBrandId < 5000) {
          const res = await fetch(`${BASE_URL}/brands/${selectedBrandId}/models?per_page=100`);
          const d = await res.json();
          const match = d.data?.find((m: AutoModel) =>
            m.name.toLowerCase() === selectedModelName.toLowerCase()
          );
          if (match) modelApiId = match.id;
        }

        if (modelApiId) {
          let url = `${BASE_URL}/models/${modelApiId}/versions?per_page=100`;
          if (selectedYear !== undefined && selectedYear !== '') {
            url += `&year=${selectedYear}`;
          }

          const res = await fetch(url);
          const d = await res.json();
          
          if (!cancelled && d.data) {
            const apiVersions = d.data.map((v: any) => ({ 
              ...v, 
              name: (v.name_raw || v.name.toUpperCase()).replace(/,/g, '.') 
            }));
            
            setVersions(apiVersions.sort((a: Version, b: Version) => a.name.localeCompare(b.name)));
          }
        }
      } catch (err) {
        console.error('Error fetching versions:', err);
      } finally {
        if (!cancelled) {
          setLoadingVersions(false);
        }
      }
    };

    fetchVersions();
    return () => { cancelled = true; };
  }, [selectedModelId, selectedModelName, selectedBrandId, selectedYear]);

  // 4. Fetch Available Years for Model (Independent of selectedYear)
  useEffect(() => {
    if (!selectedModelName) {
      setAvailableYears([]);
      return;
    }

    let cancelled = false;

    const fetchYears = async () => {
      setLoadingYears(true);

      try {
        let modelApiId: number | null = null;
        if (selectedModelId && selectedModelId < 10000) {
          modelApiId = selectedModelId;
        } else if (selectedBrandId && selectedBrandId < 5000) {
          const res = await fetch(`${BASE_URL}/brands/${selectedBrandId}/models?per_page=100`);
          const d = await res.json();
          const match = d.data?.find((m: AutoModel) =>
            m.name.toLowerCase() === selectedModelName.toLowerCase()
          );
          if (match) modelApiId = match.id;
        }

        if (modelApiId) {
          const url = `${BASE_URL}/models/${modelApiId}/versions?per_page=100&relations[]=years`;
          const res = await fetch(url);
          const d = await res.json();

          if (!cancelled && d.data && d.data.length > 0) {
            const allYears = new Set<string>();
            const yearRegex = /\b(199\d|20[0-2]\d)\b/;

            d.data.forEach((v: any) => {
              // Primary: available_years field — e.g. [0, 2025] (0 = placeholder, ignore)
              if (v.available_years && Array.isArray(v.available_years)) {
                v.available_years.forEach((yr: any) => {
                  if (yr && Number(yr) >= 1990) allYears.add(String(yr));
                });
              }
              // Secondary: year embedded in the version name — e.g. "Se-G AT 2011"
              const nameHit = (v.name_raw || v.name || '').match(yearRegex);
              if (nameHit) allYears.add(nameHit[1]);
            });

            if (!cancelled && allYears.size > 0) {
              const sortedYears = Array.from(allYears)
                .sort((a, b) => Number(b) - Number(a));
              setAvailableYears(sortedYears);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching available years:', err);
      } finally {
        if (!cancelled) {
          setLoadingYears(false);
        }
      }
    };

    fetchYears();
    return () => { cancelled = true; };
  }, [selectedModelId, selectedModelName, selectedBrandId]);

  // 4. Fetch Valuations (Infoauto + ACARA)
  useEffect(() => {
    if (!selectedVersionId || selectedVersionId >= 10000) {
      setValuations([]);
      return;
    }
    setLoadingValuations(true);
    // Requesting both infoauto and acara for better coverage, prioritizing infoauto
    fetch(`${BASE_URL}/versions/${selectedVersionId}/valuations?currency=ars&sources=infoauto,acara`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          const normalized = d.data.map((v: any) => {
            // If infoauto_price is present, we use it as the main price
            const mainPrice = v.infoauto_price || v.price;
            return {
              ...v,
              price: mainPrice ? Math.round(Number(mainPrice)).toString() : v.price,
              acara_price: v.acara_price ? Math.round(Number(v.acara_price)).toString() : v.acara_price,
              infoauto_price: v.infoauto_price ? Math.round(Number(v.infoauto_price)).toString() : v.infoauto_price
            };
          });
          setValuations(normalized);
        }
      })
      .catch(() => setValuations([]))
      .finally(() => setLoadingValuations(false));
  }, [selectedVersionId]);

  return {
    brands, models, versions, valuations, availableYears,
    loadingBrands, loadingModels, loadingVersions, loadingValuations, loadingYears,
  };
}
