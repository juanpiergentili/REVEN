import { auth } from './firebase';

const BASE_URL = 'https://app.asofix.com/api';
const API_KEY = import.meta.env.VITE_ASOFIX_API_KEY as string;

const headers = {
  'X-Api-Key': API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export async function fetchAsofix(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`Asofix API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Asofix:', error);
    throw error;
  }
}

/**
 * Obtiene el listado de marcas disponibles.
 */
export async function getBrands(carLotIds?: string[]) {
  const params: any = {};
  if (carLotIds && carLotIds.length > 0) {
    // ...
  }
  return fetchAsofix('/catalogs/brands', params);
}

/**
 * Obtiene los modelos de una marca.
 */
export async function getModels(brandId: string) {
  return fetchAsofix(`/catalogs/brands/${brandId}/models`, { published: 'true' });
}

/**
 * Obtiene las versiones de un modelo.
 */
export async function getVersions(brandId: string, modelId: string) {
  return fetchAsofix(`/catalogs/brands/${brandId}/models/${modelId}/versions`, { published: 'true' });
}

/**
 * Obtiene el catálogo completo de vehículos publicados.
 */
export async function getWebCatalog(params: Record<string, string> = {}) {
  return fetchAsofix('/catalogs/web', { published: 'true', ...params });
}
