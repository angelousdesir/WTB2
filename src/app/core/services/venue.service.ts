import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Venue, CreateVenueDto } from '../models/venue.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Create a new venue
   */
  async createVenue(venueData: CreateVenueDto): Promise<Venue> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (venueData.image) {
        const fileName = `${user.id}/${Date.now()}_${venueData.image.name}`;
        imageUrl = await this.supabaseService.uploadFile('venue-images', fileName, venueData.image);
      }

      // Create venue record
      const { data, error } = await this.supabaseService.client
        .from('venues')
        .insert([{
          owner_id: user.id,
          name: venueData.name,
          description: venueData.description,
          address: venueData.address,
          city: venueData.city,
          state: venueData.state,
          zip_code: venueData.zip_code,
          phone: venueData.phone,
          website: venueData.website,
          image_url: imageUrl,
          cuisine_type: venueData.cuisine_type,
          average_rating: 0,
          total_reviews: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Venue;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create venue');
    }
  }

  /**
   * Get all venues
   */
  async getVenues(page: number = 0, limit: number = 20): Promise<Venue[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('*')
      .order('average_rating', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Venue[];
  }

  /**
   * Get venue by ID
   */
  async getVenueById(id: string): Promise<Venue> {
    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Venue;
  }

  /**
   * Search venues by name or cuisine type
   */
  async searchVenues(query: string): Promise<Venue[]> {
    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('*')
      .or(`name.ilike.%${query}%,cuisine_type.ilike.%${query}%,city.ilike.%${query}%`)
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data as Venue[];
  }

  /**
   * Get top rated venues
   */
  async getTopVenues(limit: number = 5): Promise<Venue[]> {
    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('*')
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Venue[];
  }
}