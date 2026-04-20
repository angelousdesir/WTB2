export interface Venue {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  website?: string;
  image_url?: string;
  owner_id: string;
  average_rating: number;
  total_reviews: number;
  cuisine_type?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateVenueDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  website?: string;
  image?: File;
  cuisine_type?: string;
}

