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
   * Get all posts with pagination
   */
  async getPosts(page: number = 0, limit: number = 20): Promise<Post[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select(`
        *,
        user:users(id, username, email),
        venue:venues(id, name, city, state),
        menu_item:menu_items(id, name, category, price)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return this.mapPostsWithRelations(data);
  }

  /**
   * Get posts by venue
   */
  async getPostsByVenue(venueId: string): Promise<Post[]> {
    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select(`
        *,
        user:users(id, username, email),
        venue:venues(id, name, city, state),
        menu_item:menu_items(id, name, category, price)
      `)
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.mapPostsWithRelations(data);
  }

  /**
   * Get posts for a specific menu item
   */
  async getPostsByMenuItem(menuItemId: string): Promise<Post[]> {
    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select(`
        *,
        user:users(id, username, email),
        venue:venues(id, name, city, state),
        menu_item:menu_items(id, name, category, price)
      `)
      .eq('menu_item_id', menuItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts by menu item:', error);
      throw error;
    }

    return this.mapPostsWithRelations(data);
  }

  /**
   * Map posts with related data
   */
  private mapPostsWithRelations(data: any[]): Post[] {
    return (data || []).map((post: any) => ({
      ...post,
      user: post.user ? {
        id: post.user.id,
        username: post.user.username,
        email: post.user.email
      } : undefined,
      venue: post.venue ? {
        id: post.venue.id,
        name: post.venue.name,
        city: post.venue.city,
        state: post.venue.state
      } : undefined,
      menu_item: post.menu_item ? {
        id: post.menu_item.id,
        name: post.menu_item.name,
        category: post.menu_item.category,
        price: post.menu_item.price
      } : undefined
    })) as Post[];
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostDto): Promise<Post> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      let imageUrl: string | undefined;

      if (postData.image) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${randomString}_${postData.image.name}`;
        imageUrl = await this.supabaseService.uploadFile('post-images', fileName, postData.image);
      }

      const { data, error } = await this.supabaseService.client
        .from('posts')
        .insert([{
          user_id: user.id,
          venue_id: postData.venue_id,
          menu_item_id: postData.menu_item_id,
          title: postData.title,
          content: postData.content,
          rating: postData.rating,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          user:users(id, username, email),
          venue:venues(id, name, city, state),
          menu_item:menu_items(id, name, category, price)
        `)
        .single();

      if (error) throw error;

      return this.mapPostsWithRelations([data])[0];
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, updates: Partial<CreatePostDto>): Promise<Post> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.rating !== undefined) updateData.rating = updates.rating;

      if (updates.image) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${randomString}_${updates.image.name}`;
        const imageUrl = await this.supabaseService.uploadFile('post-images', fileName, updates.image);
        updateData.image_url = imageUrl;
      }

      const { data, error } = await this.supabaseService.client
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select(`
          *,
          user:users(id, username, email),
          venue:venues(id, name, city, state),
          menu_item:menu_items(id, name, category, price)
        `)
        .single();

      if (error) throw error;

      return this.mapPostsWithRelations([data])[0];
    } catch (error: any) {
      console.error('Error updating post:', error);
      throw new Error(error.message || 'Failed to update post');
    }
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

  /**
 * Get posts by menu item category
 */
async getPostsByCategory(category: string): Promise<Post[]> {
  const { data, error } = await this.supabaseService.client
    .from('posts')
    .select(`
      *,
      user:users(id, username, email),
      venue:venues(id, name, city, state),
      menu_item:menu_items!inner(id, name, category, price)
    `)
    .eq('menu_items.category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts by category:', error);
    throw error;
  }

  return this.mapPostsWithRelations(data);
  }
}