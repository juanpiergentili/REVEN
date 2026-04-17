
export type UserRole = 'ADMIN' | 'DEALERSHIP';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  companyName?: string;
  role: UserRole;
  membershipPlanId: string;
  avatarUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  // Profile analytics
  lastOnline?: string;
  responseTimestamps?: number[];
  totalProfileViews?: number;
  totalListingViews?: number;
  totalContactClicks?: number;
  province?: string;
  city?: string;
  phone?: string;
}

export interface WantedSearch {
  id: string;
  userId: string;
  userName: string;
  companyName: string;
  avatarUrl?: string;
  brand: string;
  model: string;
  yearRange: { min: number; max: number };
  budgetRange: { min: number; max: number };
  currency: 'USD' | 'ARS';
  description: string;
  createdAt: string;
}

export type FuelType = 'NAFTA' | 'DIESEL' | 'GNC' | 'HIBRIDO' | 'ELECTRICO';
export type BodyType = 'Sedán' | 'Hatchback' | 'SUV' | 'Pick Up' | 'Pick Up Liviana' | 'Familiar' | 'Deportivo' | 'Utilitario' | 'Minivan/Minibus' | 'Coupé' | 'Convertible';
export type Transmission = 'MANUAL' | 'AUTOMATICO';
export type VehicleCondition = '0KM' | 'USADO';
export type VehicleStatus = 'ACTIVE' | 'PAUSED' | 'SOLD';

export interface Vehicle {
  id: string;
  sellerId: string;
  sellerName: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  km: number;
  fuelType: FuelType;
  bodyType?: BodyType;
  transmission?: Transmission;
  color?: string;
  condition: VehicleCondition;
  location: string;
  province?: string;
  city?: string;
  price?: number;
  currency: 'USD' | 'ARS';
  status: VehicleStatus;
  isFeatured: boolean;
  photos: string[];
  description: string;
  createdAt: string;
  isInspected?: boolean;
  // Documentation fields
  hasVTV: boolean;
  hasPatenteAlDay: boolean;
  gncObleaVigente?: boolean;
  // Analytics
  viewCount?: number;
  contactCount?: number;
  publishedAt?: string;
  lastModifiedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  vehicleId?: string;
  vehicleInfo?: {
    brand: string;
    model: string;
    year: number;
    photo: string;
    price?: number;
  };
  buyerId: string;
  sellerId: string;
  sellerName?: string;
  buyerName?: string;
  sellerCompany?: string;
  buyerCompany?: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt?: string;
}
