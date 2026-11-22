// Axxodia.Shared/Dtos/Offers  (offers are PERCENTAGE discounts)

export type OfferAudience = 'AllCustomers' | 'TargetedCustomers' | 'Country';

export interface Offer {
  id: number;
  title: string;
  image_url?: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  audience: OfferAudience;
  target_country?: string | null;
  is_active: boolean;
  target_customers_count: number;
  created_at: string;
}

export interface OfferDetails {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  audience: OfferAudience;
  target_country?: string | null;
  is_active: boolean;
  created_by_staff_id: number;
  created_by_staff_name?: string | null;
  customer_ids: number[];
  created_at: string;
}

export interface OfferRequest {
  title: string;
  description: string;
  image_url?: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  audience: OfferAudience;
  customer_ids: number[];
  target_country?: string | null;
}
