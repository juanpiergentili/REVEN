// Helpers de publicación — lógica extraída del componente Publish.tsx
// Formateo argentino, validaciones por paso, traducción de errores, opciones predefinidas

import type { ChapaPinturaItem, EstadoCubiertas } from '../types';

// ─── Formateo argentino ──────────────────────────────────────────────────────

/**
 * Formatea un string numérico con separador de miles argentino (punto).
 * Ej: "1234567" → "1.234.567"
 */
export function formatArgentineNumber(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Quita los puntos de formato para obtener el valor numérico puro.
 * Ej: "1.234.567" → "1234567"
 */
export function parseArgentineNumber(formatted: string): string {
  return formatted.replace(/\./g, '');
}

// ─── Opciones predefinidas de inspección ─────────────────────────────────────

export const OBSERVACIONES_INTERNAS_OPTIONS = [
  'Falla en pantalla',
  'Radio no funciona',
  'Aire acondicionado no funciona o sin carga',
  'Calefacción no funciona',
  'Tapizado roto',
  'Limpieza interior',
] as const;

export const PANELES_CHAPA = [
  'Paragolpe delantero',
  'Paragolpe trasero',
  'Capot',
  'Techo',
  'Puerta delantera izquierda',
  'Puerta delantera derecha',
  'Puerta trasera izquierda',
  'Puerta trasera derecha',
  'Guardabarro delantero derecho',
  'Guardabarro delantero izquierdo',
  'Guardabarro trasero derecho',
  'Guardabarro trasero izquierdo',
  'Baúl',
  'Cachas espejos',
  'Zócalo izquierdo',
  'Zócalo derecho',
] as const;

export const TIPO_DANO_CHAPA = [
  { value: 'repintar' as const, label: 'Repintar' },
  { value: 'reparar' as const, label: 'Reparar' },
  { value: 'microbollo' as const, label: 'Microbollo' },
];

export const TIPO_DANO_CACHAS = [
  { value: 'cambiar' as const, label: 'Cambiar' },
  { value: 'repintar' as const, label: 'Repintar' },
];

export const OPTICAS_OPTIONS = [
  'Delantera izquierda',
  'Delantera derecha',
  'Trasera izquierda',
  'Trasera derecha',
] as const;

export const FALLAS_MECANICAS_OPTIONS = [
  'Falla en caja',
  'Tren delantero',
  'Tren trasero',
  'Frenos',
  'Check ABS',
  'Check Engine',
] as const;

// ─── Estado inicial de inspección ────────────────────────────────────────────

export interface InspectionFormData {
  sinGastos: boolean;
  observacionesInternas: string[];
  observacionesNotas: string;
  cubiertas: EstadoCubiertas;
  chapaPintura: ChapaPinturaItem[];
  opticasDanadas: string[];
  fallasMecanicas: string[];
}

export const INITIAL_INSPECTION: InspectionFormData = {
  sinGastos: false,
  observacionesInternas: [],
  observacionesNotas: '',
  cubiertas: { cambiar: 0, sinAuxilio: false },
  chapaPintura: [],
  opticasDanadas: [],
  fallasMecanicas: [],
};

// ─── Tipo del form principal ─────────────────────────────────────────────────

export type PublishFormData = {
  brand: string;
  model: string;
  version: string;
  year: string;
  km: string;
  fuelType: string;
  bodyType: string;
  transmission: string;
  color: string;
  doors: string;
  seats: string;
  engine: string;
  condition: 'USADO' | '0KM';
  province: string;
  city: string;
  hasVTV: boolean;
  hasPatenteAlDay: boolean;
  gncObleaVigente: boolean;
  uniqueOwner: boolean;
  officialService: boolean;
  description: string;
  currency: 'USD' | 'ARS';
  price: string;
};

export const INITIAL_FORM: PublishFormData = {
  brand: '', model: '', version: '', year: '', km: '',
  fuelType: '', bodyType: '', transmission: '', color: '',
  doors: '', seats: '', engine: '',
  condition: 'USADO', province: '', city: '',
  hasVTV: false, hasPatenteAlDay: false, gncObleaVigente: false,
  uniqueOwner: false, officialService: false,
  description: '', currency: 'USD', price: '',
};

// ─── Validaciones por paso ───────────────────────────────────────────────────

export function validateStep(
  step: number,
  formData: PublishFormData,
  photos: File[],
): string | null {
  switch (step) {
    case 1: {
      if (!formData.brand) return 'Por favor, seleccioná la marca del vehículo.';
      if (!formData.model) return 'Ingresá el modelo para continuar.';
      if (!formData.version) return 'Ingresá la versión para continuar.';
      if (!formData.year) return 'Debés indicar el año de fabricación.';
      if (formData.condition === 'USADO') {
        const kmRaw = parseArgentineNumber(formData.km);
        if (!kmRaw || Number(kmRaw) < 0) {
          return 'Para vehículos usados, el kilometraje es obligatorio.';
        }
      }
      if (!formData.fuelType) return 'Seleccioná el tipo de combustible.';
      if (!formData.transmission) return 'Seleccioná el tipo de transmisión.';
      if (!formData.bodyType) return 'Seleccioná el tipo de carrocería.';
      if (!formData.color) return 'Seleccioná el color del vehículo.';
      if (!formData.doors) return 'Seleccioná la cantidad de puertas.';
      if (!formData.seats) return 'Seleccioná la cantidad de asientos.';
      if (!formData.condition) return 'Seleccioná la condición del vehículo.';
      if (!formData.province) return 'Indicá en qué provincia se encuentra la unidad.';
      if (!formData.city) return 'Indicá en qué localidad se encuentra la unidad.';
      return null;
    }
    // Step 2 (fotos) — validación manejada con diálogo de confirmación, no bloqueante
    case 2:
      return null;
    // Step 3 (legal) — todo opcional
    case 3:
      return null;
    // Step 4 (estado técnico) — todo opcional
    case 4:
      return null;
    // Step 5 (precio)
    case 5: {
      const priceRaw = parseArgentineNumber(formData.price);
      if (!priceRaw || Number(priceRaw) <= 0) {
        return 'El precio debe ser mayor a 0.';
      }
      return null;
    }
    // Step 6 (preview) — sin validación extra
    case 6:
      return null;
    default:
      return null;
  }
}

// ─── Traducción de errores Firebase ──────────────────────────────────────────

export function getFirebaseErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  // Firebase Auth errors
  if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
    return 'No tenés permisos para publicar. Verificá que tu cuenta esté aprobada.';
  }
  if (msg.includes('unavailable') || msg.includes('UNAVAILABLE')) {
    return 'Servicio temporalmente no disponible. Verificá tu conexión a internet e intentá de nuevo.';
  }
  if (msg.includes('unauthenticated') || msg.includes('UNAUTHENTICATED')) {
    return 'Tu sesión expiró. Por favor, volvé a iniciar sesión.';
  }
  if (msg.includes('deadline-exceeded') || msg.includes('DEADLINE_EXCEEDED')) {
    return 'La operación tardó demasiado. Verificá tu conexión e intentá de nuevo.';
  }
  if (msg.includes('resource-exhausted') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Se alcanzó el límite de operaciones. Esperá unos minutos e intentá de nuevo.';
  }

  // Firebase Storage errors
  if (msg.includes('storage/unauthorized')) {
    return 'No se pudieron subir las fotos. Verificá los permisos de tu cuenta.';
  }
  if (msg.includes('storage/canceled')) {
    return 'La subida de fotos fue cancelada.';
  }
  if (msg.includes('storage/retry-limit-exceeded')) {
    return 'No se pudieron subir las fotos después de varios intentos. Verificá tu conexión.';
  }
  if (msg.includes('storage/quota-exceeded')) {
    return 'Se superó el límite de almacenamiento. Contactá al soporte.';
  }

  // Network errors
  if (msg.includes('network') || msg.includes('Failed to fetch') || msg.includes('offline')) {
    return 'Error de conexión. Verificá tu internet e intentá de nuevo.';
  }

  // Generic fallback
  return `No pudimos completar la operación: ${msg}`;
}

// ─── Helper: verificar si la inspección tiene datos cargados ─────────────────

export function hasInspectionData(inspection: InspectionFormData): boolean {
  return (
    inspection.sinGastos ||
    inspection.observacionesInternas.length > 0 ||
    inspection.observacionesNotas.trim() !== '' ||
    inspection.cubiertas.cambiar > 0 ||
    inspection.cubiertas.sinAuxilio ||
    inspection.chapaPintura.length > 0 ||
    inspection.opticasDanadas.length > 0 ||
    inspection.fallasMecanicas.length > 0
  );
}
