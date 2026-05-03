import { useState, useEffect } from 'react';

const BASE_URL = 'https://argautos.com/api/v1';

export type Brand = { id: number; name: string; slug: string };
export type AutoModel = { id: number; name: string; slug: string; brand_id: number };
export type Version = { id: number; name: string; slug: string; model_id: number };
export type Valuation = { id: number; year: number; price: string; currency: string };

export function useArgAutos(selectedBrandName?: string, selectedModelName?: string, selectedVersionName?: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<AutoModel[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingValuations, setLoadingValuations] = useState(false);

  // 1. Fetch Brands
  useEffect(() => {
    let mounted = true;
    setLoadingBrands(true);
    fetch(`${BASE_URL}/brands?per_page=500`)
      .then(r => r.json())
      .then(d => { if (mounted) setBrands(d.data || []) })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingBrands(false) });
    return () => { mounted = false; };
  }, []);

  // 2. Resolve IDs based on names
  const selectedBrandId = brands.find(b => b.name === selectedBrandName)?.id;
  const selectedModelId = models.find(m => m.name === selectedModelName)?.id;
  const selectedVersionId = versions.find(v => v.name === selectedVersionName)?.id;

  // 3. Fetch Models
  useEffect(() => {
    let mounted = true;
    if (!selectedBrandId) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    fetch(`${BASE_URL}/brands/${selectedBrandId}/models?per_page=1000`)
      .then(r => r.json())
      .then(d => { if (mounted) setModels(d.data || []) })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingModels(false) });
    return () => { mounted = false; };
  }, [selectedBrandId]);

  // 4. Fetch Versions
  useEffect(() => {
    let mounted = true;
    if (!selectedModelId) {
      setVersions([]);
      return;
    }
    setLoadingVersions(true);
    fetch(`${BASE_URL}/models/${selectedModelId}/versions?per_page=1000`)
      .then(r => r.json())
      .then(d => { if (mounted) setVersions(d.data || []) })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingVersions(false) });
    return () => { mounted = false; };
  }, [selectedModelId]);

  // 5. Fetch Valuations (ACARA prices)
  useEffect(() => {
    let mounted = true;
    if (!selectedVersionId) {
      setValuations([]);
      return;
    }
    setLoadingValuations(true);
    fetch(`${BASE_URL}/versions/${selectedVersionId}/valuations?currency=ars&per_page=500`)
      .then(r => r.json())
      .then(d => { if (mounted) setValuations(d.data || []) })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingValuations(false) });
    return () => { mounted = false; };
  }, [selectedVersionId]);

  return { 
    brands, 
    models, 
    versions, 
    valuations, 
    loadingBrands, 
    loadingModels, 
    loadingVersions, 
    loadingValuations 
  };
}
