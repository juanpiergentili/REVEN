
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
  condition: VehicleCondition;
  location: string;
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
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  vehicleId: string;
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    photo: string;
  };
  buyerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageAt: string;
}
