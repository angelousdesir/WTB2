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
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${randomString}_${venueData.image.name}`;
        
        console.log('Uploading venue image to:', fileName);
        imageUrl = await this.supabaseService.uploadFile('venue-images', fileName, venueData.image);
        console.log('Uploaded venue image URL:', imageUrl);
      }

      // Create venue record
      const venueRecord = {
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
      };

      console.log('Creating venue with data:', venueRecord);

      const { data, error } = await this.supabaseService.client
        .from('venues')
        .insert([venueRecord])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating venue:', error);
        throw error;
      }
      
      console.log('Created venue:', data);
      return data as Venue;
    } catch (error: any) {
      console.error('Error in createVenue:', error);
      throw new Error(error.message || 'Failed to create venue');
    }
  }

  /**
   * Update an existing venue
   */
  async updateVenue(venueId: string, venueData: Partial<CreateVenueDto>): Promise<Venue> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      const isOwner = await this.isVenueOwner(venueId);
      if (!isOwner) {
        throw new Error('You do not have permission to edit this venue');
      }

      let imageUrl: string | undefined;

      // Upload new image if provided
      if (venueData.image) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${randomString}_${venueData.image.name}`;
        
        console.log('Uploading new venue image to:', fileName);
        imageUrl = await this.supabaseService.uploadFile('venue-images', fileName, venueData.image);
        console.log('Uploaded new venue image URL:', imageUrl);
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (venueData.name !== undefined) updateData.name = venueData.name;
      if (venueData.description !== undefined) updateData.description = venueData.description;
      if (venueData.address !== undefined) updateData.address = venueData.address;
      if (venueData.city !== undefined) updateData.city = venueData.city;
      if (venueData.state !== undefined) updateData.state = venueData.state;
      if (venueData.zip_code !== undefined) updateData.zip_code = venueData.zip_code;
      if (venueData.phone !== undefined) updateData.phone = venueData.phone;
      if (venueData.website !== undefined) updateData.website = venueData.website;
      if (venueData.cuisine_type !== undefined) updateData.cuisine_type = venueData.cuisine_type;
      if (imageUrl) updateData.image_url = imageUrl;

      console.log('Updating venue with data:', updateData);

      const { data, error } = await this.supabaseService.client
        .from('venues')
        .update(updateData)
        .eq('id', venueId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating venue:', error);
        throw error;
      }
      
      console.log('Updated venue:', data);
      return data as Venue;
    } catch (error: any) {
      console.error('Error in updateVenue:', error);
      throw new Error(error.message || 'Failed to update venue');
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

    if (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
    
    console.log('Fetched venues:', data);
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
    console.log('Fetched venue by ID:', data);
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

  /**
   * Get venues owned by current user
   */
  async getMyVenues(): Promise<Venue[]> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Venue[];
  }

  /**
   * Check if current user owns a venue
   */
  async isVenueOwner(venueId: string): Promise<boolean> {
    const user = this.authService.currentUserValue;
    if (!user) return false;

    if (user.role === 'admin') return true;

    const { data, error } = await this.supabaseService.client
      .from('venues')
      .select('owner_id')
      .eq('id', venueId)
      .single();

    if (error) return false;
    return data?.owner_id === user.id;
  }

  /**
   * Delete a venue
   */
  async deleteVenue(venueId: string): Promise<void> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      const isOwner = await this.isVenueOwner(venueId);
      if (!isOwner) {
        throw new Error('You do not have permission to delete this venue');
      }

      const { error } = await this.supabaseService.client
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) {
        console.error('Supabase error deleting venue:', error);
        throw error;
      }
      
      console.log('Deleted venue:', venueId);
    } catch (error: any) {
      console.error('Error in deleteVenue:', error);
      throw new Error(error.message || 'Failed to delete venue');
    }
  }
}