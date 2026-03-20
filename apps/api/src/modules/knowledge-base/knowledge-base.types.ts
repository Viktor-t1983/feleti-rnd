/**
 * Knowledge Base Types
 * Type definitions for Equipment Catalog, Markets, Competitors
 */

import type { EquipmentCategory, MarketRegion } from '@prisma/client';

// ==========================================
// EQUIPMENT TYPES
// ==========================================

export interface EquipmentSpecification {
  key: string;
  value: string | number;
  unit?: string;
}

export interface CreateEquipmentInput {
  code: string;
  name: string;
  shortName?: string;
  category: EquipmentCategory;
  description?: string;
  specifications?: EquipmentSpecification[];
  basePrice?: number;
  currency?: string;
  images?: string[];
  documentationUrl?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  leadTimeDays?: number;
  isCustom?: boolean;
}

export interface UpdateEquipmentInput {
  name?: string;
  shortName?: string;
  category?: EquipmentCategory;
  description?: string;
  specifications?: EquipmentSpecification[];
  basePrice?: number;
  currency?: string;
  images?: string[];
  documentationUrl?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  leadTimeDays?: number;
  isActive?: boolean;
}

export interface EquipmentFilters {
  category?: EquipmentCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EquipmentListItem {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  category: EquipmentCategory;
  basePrice: number | null;
  currency: string;
  isActive: boolean;
  isCustom: boolean;
  manufacturer: string;
  leadTimeDays: number | null;
  createdAt: Date;
}

// ==========================================
// MARKET TYPES
// ==========================================

export interface CreateMarketInput {
  code: string;
  name: string;
  region: MarketRegion;
  description?: string;
  population?: number;
  gdpPerCapita?: number;
  languages?: string[];
  currencies?: string[];
  meatConsumptionKgPerCapita?: number;
  preferredMeatTypes?: string[];
  certificationsRequired?: string[];
  standards?: string[];
  importTaxes?: Record<string, unknown>;
  priority?: number;
  industry?: string;
  companiesCount?: number;
  productionVolumeTons?: number;
  exportVolumeTons?: number;
  importVolumeTons?: number;
  dataSource?: string;
  dataYear?: number;
  flagEmoji?: string;
}

export interface UpdateMarketInput {
  name?: string;
  region?: MarketRegion;
  description?: string;
  population?: number;
  gdpPerCapita?: number;
  languages?: string[];
  currencies?: string[];
  meatConsumptionKgPerCapita?: number;
  preferredMeatTypes?: string[];
  certificationsRequired?: string[];
  standards?: string[];
  importTaxes?: Record<string, unknown>;
  isActive?: boolean;
  priority?: number;
  industry?: string;
  companiesCount?: number;
  productionVolumeTons?: number;
  exportVolumeTons?: number;
  importVolumeTons?: number;
  dataSource?: string;
  dataYear?: number;
  flagEmoji?: string;
}

export interface MarketFilters {
  region?: MarketRegion;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MarketListItem {
  id: string;
  code: string;
  name: string;
  region: MarketRegion;
  population: number | null;
  gdpPerCapita: number | null;
  meatConsumptionKgPerCapita: number | null;
  isActive: boolean;
  priority: number;
  _count?: {
    competitors: number;
    equipment: number;
  };
  // Новые поля
  flagEmoji: string;
  industry: string | null;
  companiesCount: number | null;
  productionVolumeTons: number | null;
  exportVolumeTons: number | null;
  importVolumeTons: number | null;
  dataSource: string | null;
  dataYear: number | null;
}

// ==========================================
// COMPETITOR TYPES
// ==========================================

export interface CreateCompetitorInput {
  name: string;
  legalName?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  foundedYear?: number;
  employeesCount?: number;
  annualRevenue?: number;
  marketShare?: number;
  strengths?: string[];
  weaknesses?: string[];
  productRange?: string[];
  priceSegment?: 'low' | 'mid' | 'premium';
  threatLevel?: 'low' | 'medium' | 'high';
}

export interface UpdateCompetitorInput {
  name?: string;
  legalName?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  foundedYear?: number;
  employeesCount?: number;
  annualRevenue?: number;
  marketShare?: number;
  strengths?: string[];
  weaknesses?: string[];
  productRange?: string[];
  priceSegment?: 'low' | 'mid' | 'premium';
  threatLevel?: 'low' | 'medium' | 'high';
  isActive?: boolean;
}

export interface CompetitorFilters {
  isActive?: boolean;
  threatLevel?: 'low' | 'medium' | 'high';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompetitorListItem {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  annualRevenue: number | null;
  marketShare: number | null;
  priceSegment: string;
  isActive: boolean;
  threatLevel: string;
  _count?: {
    markets: number;
    equipment: number;
  };
}

export interface CompetitorEquipmentInput {
  equipmentTypeId?: string;
  name: string;
  modelNumber?: string;
  specifications?: Record<string, unknown>;
  advantages?: string[];
  disadvantages?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency?: string;
}

export interface CompetitorMarketInput {
  marketId: string;
  marketShare?: number;
  entryYear?: number;
  notes?: string;
}

// ==========================================
// SUMMARY & STATS
// ==========================================

export interface KnowledgeBaseSummary {
  equipment: {
    total: number;
    byCategory: Record<EquipmentCategory, number>;
    active: number;
    custom: number;
  };
  markets: {
    total: number;
    byRegion: Record<MarketRegion, number>;
    active: number;
  };
  competitors: {
    total: number;
    byThreatLevel: Record<string, number>;
    active: number;
  };
  calculationsLibrary: {
    total: number;
    byCategory: Record<string, number>;
    active: number;
  };
}

// ==========================================
// CALCULATIONS LIBRARY
// ==========================================

export interface CalculationLibraryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
}
