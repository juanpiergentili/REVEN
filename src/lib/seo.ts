// ─── SEO Helpers ─────────────────────────────────────────────────────────────

/**
 * Genera un slug SEO-friendly para URLs de vehículos.
 * Formato: marca-modelo-version-año-id
 * Ej: "alfa-romeo-mito-14-tbi-2015-abc123"
 */
export function generateVehicleSlug(
  brand: string | undefined,
  model: string | undefined,
  version: string | undefined,
  year: number | string | undefined,
  id: string,
): string {
  const parts = [brand, model, version, String(year || '')]
    .map(part => {
      if (!part) return '';
      return part
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with dash
        .replace(/-+/g, '-')             // collapse multiple dashes
        .replace(/^-|-$/g, '')           // trim dashes
    })
    .filter(Boolean);

  // Append full Firestore ID unmodified — needed for exact document lookup
  // We ensure there's at least one dash before the ID if parts is empty
  const slugBase = parts.join('-');
  return slugBase ? `${slugBase}-${id}` : id;
}

/**
 * Extrae el ID del vehículo del slug SEO.
 * El ID es el último segmento del slug (sin guiones, case-sensitive).
 */
export function extractIdFromSlug(slug: string | undefined | null): string {
  if (!slug) return '';
  
  // Clean the slug: trim whitespace and remove trailing/leading dashes
  const cleanSlug = String(slug).trim().replace(/^-+|-+$/g, '');
  
  if (!cleanSlug) return '';

  // If there are no dashes, the whole slug is the ID (legacy support)
  if (!cleanSlug.includes('-')) {
    return cleanSlug;
  }

  // Standard REVEN format: brand-model-year-id
  // The ID is always the last segment and is case-sensitive
  const parts = cleanSlug.split('-');
  return parts[parts.length - 1] || '';
}

/**
 * Genera el path completo para la URL de un vehículo.
 */
export function getVehiclePath(
  brand: string,
  model: string,
  version: string,
  year: number | string,
  id: string,
): string {
  return `/vehicle/${generateVehicleSlug(brand, model, version, year, id)}`;
}
