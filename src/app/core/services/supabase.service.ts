import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Upload file to Supabase storage bucket
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    console.log(`Uploading file to bucket: ${bucket}, path: ${path}`);
    
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Changed to true to allow overwriting
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful, data:', data);

    // Get public URL
    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('Public URL:', publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  }

  /**
   * Delete file from Supabase storage bucket
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }
  }

  /**
   * Get authenticated user
   */
  async getUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Get session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }
}