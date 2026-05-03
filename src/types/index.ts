// ─── Shared enums ────────────────────────────────────────────────────────────

export type Currency         = 'USD' | 'ARS';
export type UserRole         = 'ADMIN' | 'DEALERSHIP' | 'USER';
export type UserStatus       = 'pending' | 'approved' | 'rejected' | 'suspended';
export type MembershipPlan   = 'plata' | 'oro' | 'platinum' | 'enterprise';
export type BillingCycle     = 'monthly' | 'annual';
export type MembershipStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';
export type ReservationStatus= 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type VehicleStatus    = 'ACTIVE' | 'PAUSED' | 'SOLD' | 'RESERVED' | 'DRAFT';
export type VehicleCondition = '0KM' | 'USADO';
export type FuelType         = 'NAFTA' | 'DIESEL' | 'GNC' | 'HIBRIDO' | 'ELECTRICO';
export type BodyType         = 'Sedán' | 'Hatchback' | 'SUV' | 'Pick Up' | 'Pick Up Liviana'
                             | 'Familiar' | 'Deportivo' | 'Utilitario' | 'Minivan/Minibus'
                             | 'Coupé' | 'Convertible';
export type Transmission     = 'MANUAL' | 'AUTOMATICO';
export type MessageType      = 'text' | 'system' | 'offer';
export type NotificationType =
  | 'new_message'
  | 'vehicle_view'
  | 'new_wanted_match'
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'reservation_cancelled'
  | 'membership_expiring'
  | 'admission_approved'
  | 'admission_rejected';

// ─── User ─────────────────────────────────────────────────────────────────────

/** Perfil público — legible por cualquier usuario autenticado */
export interface User {
  id: string;

  // Identidad (pública)
  name: string;
  lastName: string;
  companyName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;

  // Ubicación (pública)
  province?: string;
  city?: string;

  // Membresía
  membershipId?: string;
  membershipPlan: MembershipPlan;

  // Analytics públicos (escritos por Cloud Functions, no por cliente)
  totalProfileViews: number;
  totalListingViews: number;
  totalContactClicks: number;
  totalVehiclesPublished: number;
  averageResponseMinutes?: number;
  lastOnline?: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

/** Datos privados — solo owner + admin. Ruta: /users/{uid}/private/{uid} */
export interface UserPrivate {
  email: string;
  cuil: string;
  phone: string;
  billingAddress?: string;
  taxCategory?: 'monotributo' | 'responsable_inscripto' | 'exento';
  admissionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── Vehicle Inspection ───────────────────────────────────────────────────────

export interface ChapaPinturaItem {
  panel: string;
  tipo: 'repintar' | 'reparar' | 'microbollo' | 'cambiar';
}

export interface EstadoCubiertas {
  cambiar: number; // 0-4 cubiertas a cambiar
  sinAuxilio: boolean;
}

export interface VehicleInspection {
  // Sin gastos — vehículo sin ningún detalle
  sinGastos?: boolean;

  // Observaciones internas (checkboxes predefinidos + texto libre)
  observacionesInternas: string[];
  observacionesNotas: string;

  // Estado de cubiertas
  cubiertas: EstadoCubiertas;

  // Chapa y pintura (paño + tipo de daño)
  chapaPintura: ChapaPinturaItem[];

  // Ópticas dañadas
  opticasDanadas: string[];

  // Fallas mecánicas graves
  fallasMecanicas: string[];
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;

  // Vendedor (desnormalizado)
  sellerId: string;
  sellerName: string;
  sellerCompany: string;

  // Datos del vehículo
  brand: string;
  model: string;
  version: string;
  year: number;
  km: number;
  condition: VehicleCondition;
  fuelType: FuelType;
  bodyType?: BodyType;
  transmission?: Transmission;
  color?: string;

  // Ubicación
  province?: string;
  city?: string;
  location: string;

  // Precio
  price?: number;
  currency: Currency;
  priceNegotiable: boolean;

  // Documentación
  hasVTV: boolean;
  hasPatenteAlDay: boolean;
  uniqueOwner?: boolean;
  officialService?: boolean;
  gncObleaVigente?: boolean;
  isInspected: boolean;

  // Inspección técnica (datos de agencia)
  inspectionData?: VehicleInspection;
  inspection?: VehicleInspection; // Alias for compatibility with form

  // Contenido
  photos: string[];
  description: string;

  // Estado
  status: VehicleStatus;
  isFeatured: boolean;
  reservedById?: string;

  // Analytics
  viewCount: number;
  contactCount: number;

  // Metadata
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  soldAt?: string;
}

// ─── Wanted Search ────────────────────────────────────────────────────────────

export interface WantedSearch {
  id: string;

  // Usuario (desnormalizado)
  userId: string;
  userName: string;
  companyName: string;
  avatarUrl?: string;
  province?: string;

  // Búsqueda
  brand: string;
  model?: string;
  version?: string;
  yearRange: { min: number; max: number };
  kmApprox?: number;
  budgetRange: { min: number; max: number };
  currency: Currency;
  conditions: VehicleCondition[];
  color?: string;
  description?: string;

  // Estado
  status: 'active' | 'fulfilled' | 'expired';
  expiresAt: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface VehicleSnapshot {
  brand: string;
  model: string;
  year: number;
  photoUrl: string;
  price?: number;
  currency: Currency;
}

export interface Conversation {
  id: string;
  participants: [string, string];

  // Contexto del vehículo
  vehicleId?: string;
  vehicleSnapshot?: VehicleSnapshot;

  // Partes (desnormalizado)
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  buyerCompany: string;
  sellerCompany: string;
  buyerAvatarUrl?: string;
  sellerAvatarUrl?: string;

  // Último mensaje
  lastMessage?: string;
  lastMessageAt: string;
  lastSenderId?: string;

  // No leídos por participante: { [uid]: count }
  unreadCount: Record<string, number>;

  // Metadata
  createdAt?: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  text: string;

  // Solo para type === 'offer'
  offerAmount?: number;
  offerCurrency?: Currency;
  offerStatus?: 'pending' | 'accepted' | 'rejected';

  read: boolean;
  readAt?: string;
  createdAt: string;
}

// ─── Reservation ──────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  vehicleId: string;
  buyerId: string;
  sellerId: string;

  vehicleSnapshot: {
    brand: string;
    model: string;
    year: number;
    price?: number;
    currency: Currency;
  };

  agreedPrice?: number;
  agreedCurrency?: Currency;
  notes?: string;

  status: ReservationStatus;
  conversationId?: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
  expiresAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

// ─── Membership ───────────────────────────────────────────────────────────────

export interface Membership {
  id: string;
  userId: string;
  plan: MembershipPlan;
  billingCycle: BillingCycle;

  pricePaid: number;
  currency: Currency;

  status: MembershipStatus;

  // Límites al momento de contratar
  maxVehicles: number;
  canFeatureListing: boolean;

  // Facturación
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;

  discountCode?: string;
  discountPercent?: number;

  // Metadata
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;

  resourceType?: 'vehicle' | 'conversation' | 'reservation' | 'membership';
  resourceId?: string;

  createdAt: string;
  readAt?: string;
}

// ─── Plan limits (constantes de negocio) ─────────────────────────────────────

export const PLAN_LIMITS: Record<MembershipPlan, { maxVehicles: number; canFeatureListing: boolean }> = {
  plata:      { maxVehicles: 5,   canFeatureListing: false },
  oro:        { maxVehicles: 25,  canFeatureListing: true  },
  platinum:   { maxVehicles: 150, canFeatureListing: true  },
  enterprise: { maxVehicles: Infinity, canFeatureListing: true },
};

export const PLAN_PRICES: Record<MembershipPlan, { monthly: number; annual: number }> = {
  plata:      { monthly: 120,  annual: 999  },
  oro:        { monthly: 180,  annual: 1500 },
  platinum:   { monthly: 300,  annual: 2500 },
  enterprise: { monthly: 0,    annual: 0    }, // precio a consultar
};
