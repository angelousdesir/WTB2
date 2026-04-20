import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Post, CreatePostDto } from '../models/post.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Create a new post with image upload
   */
  async createPost(postData: CreatePostDto): Promise<Post> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (postData.image) {
        const fileName = `${user.id}/${Date.now()}_${postData.image.name}`;
        imageUrl = await this.supabaseService.uploadFile('post-images', fileName, postData.image);
      }

      // Create post record
      const { data, error } = await this.supabaseService.client
        .from('posts')
        .insert([{
          user_id: user.id,
          caption: postData.caption,
          image_url: imageUrl,
          rating: postData.rating,
          venue_id: postData.venue_id,
          menu_item_id: postData.menu_item_id,
          category: postData.category,
          created_at: new Date().toISOString()
        }])
        .select('*, user:users(username, avatar_url), venue:venues(name), menu_item:menu_items(name)')
        .single();

      if (error) throw error;
      return data as Post;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create post');
    }
  }

  /**
   * Get all posts with pagination
   */
  async getPosts(page: number = 0, limit: number = 20): Promise<Post[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select('*, user:users(username, avatar_url), venue:venues(name), menu_item:menu_items(name)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Post[];
  }

  /**
   * Get posts by venue
   */
  async getPostsByVenue(venueId: string, page: number = 0, limit: number = 20): Promise<Post[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select('*, user:users(username, avatar_url), venue:venues(name), menu_item:menu_items(name)')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Post[];
  }

  /**
   * Get posts by menu item
   */
  async getPostsByMenuItem(menuItemId: string): Promise<Post[]> {
    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select('*, user:users(username, avatar_url), venue:venues(name), menu_item:menu_items(name)')
      .eq('menu_item_id', menuItemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Post[];
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(category: string, page: number = 0, limit: number = 20): Promise<Post[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select('*, user:users(username, avatar_url), venue:venues(name), menu_item:menu_items(name)')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Post[];
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }
}