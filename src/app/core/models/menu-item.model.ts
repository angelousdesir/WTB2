export interface MenuItem {
  id: string;
  venue_id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  image_url?: string;
  average_rating: number;
  total_reviews: number;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ParsedMenuItem {
  name: string;
  description?: string;
  price?: number;
  category?: string;
}