import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ParsedMenuItem, MenuItem } from '../models/menu-item.model';
import * as Tesseract from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class MenuParserService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Parse menu image using OCR
   */
  async parseMenuImage(imageFile: File): Promise<ParsedMenuItem[]> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: m => console.log(m)
      });

      const text = result.data.text;
      return this.parseMenuText(text);
    } catch (error) {
      throw new Error('Failed to parse menu image');
    }
  }

  /**
   * Parse PDF menu
   */
  async parsePdfMenu(pdfFile: File): Promise<ParsedMenuItem[]> {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const text = await this.extractTextFromPdf(uint8Array);
      return this.parseMenuText(text);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF menu. Please try uploading an image or entering items manually.');
    }
  }

  private async extractTextFromPdf(pdfData: Uint8Array): Promise<string> {
    try {
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const text = await this.convertPdfToText(blob);
      return text;
    } catch (error) {
      throw new Error('PDF text extraction failed. Please try manual entry.');
    }
  }

  private async convertPdfToText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text || '');
      };
      reader.onerror = () => reject(new Error('Failed to read PDF'));
      reader.readAsText(blob);
    });
  }

  parseMenuText(text: string): ParsedMenuItem[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const items: ParsedMenuItem[] = [];
    let currentCategory = 'Uncategorized';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isCategoryHeader(line)) {
        currentCategory = line;
        continue;
      }

      const parsed = this.parseMenuItem(line);
      if (parsed) {
        items.push({
          ...parsed,
          category: currentCategory
        });
      }
    }

    return items;
  }

  private isCategoryHeader(line: string): boolean {
    const categoryKeywords = ['appetizers', 'entrees', 'mains', 'desserts', 'drinks', 'beverages', 'starters', 'salads', 'soups'];
    const isAllCaps = line === line.toUpperCase() && line.length < 30;
    const containsKeyword = categoryKeywords.some(keyword => line.toLowerCase().includes(keyword));
    
    return isAllCaps || containsKeyword;
  }

  private parseMenuItem(line: string): ParsedMenuItem | null {
    const pricePattern = /\$?(\d+\.\d{2})/;
    const priceMatch = line.match(pricePattern);

    if (!priceMatch) {
      return null;
    }

    const price = parseFloat(priceMatch[1]);
    const nameAndDesc = line.replace(pricePattern, '').trim();
    const parts = nameAndDesc.split(/[-–—]/);
    
    if (parts.length >= 2) {
      return {
        name: parts[0].trim(),
        description: parts.slice(1).join(' ').trim(),
        price
      };
    } else {
      return {
        name: nameAndDesc,
        price
      };
    }
  }

  /**
   * Save parsed menu items to database
   */
  async saveMenuItems(venueId: string, items: ParsedMenuItem[]): Promise<MenuItem[]> {
    const savedItems: MenuItem[] = [];

    for (const item of items) {
      try {
        let imageUrl: string | undefined;

        // Upload image if provided
        if (item.image) {
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileName = `${venueId}/${timestamp}_${randomString}_${item.image.name}`;
          
          console.log('Uploading menu item image to:', fileName);
          imageUrl = await this.supabaseService.uploadFile('menu-item-images', fileName, item.image);
          console.log('Uploaded menu item image URL:', imageUrl);
        }

        const menuItem = {
          venue_id: venueId,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category || 'Uncategorized',
          image_url: imageUrl,
          average_rating: 0,
          total_reviews: 0,
          is_available: true,
          created_at: new Date().toISOString()
        };

        const { data, error } = await this.supabaseService.client
          .from('menu_items')
          .insert([menuItem])
          .select()
          .single();

        if (error) throw error;
        savedItems.push(data as MenuItem);
      } catch (error) {
        console.error('Error saving menu item:', item.name, error);
        // Continue with other items even if one fails
      }
    }

    if (savedItems.length === 0) {
      throw new Error('Failed to save any menu items');
    }

    return savedItems;
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(itemId: string, updates: Partial<MenuItem & { image?: File }>): Promise<MenuItem> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Upload new image if provided
    if (updates.image) {
      // Get the current item to get venue_id
      const { data: currentItem } = await this.supabaseService.client
        .from('menu_items')
        .select('venue_id')
        .eq('id', itemId)
        .single();

      if (currentItem) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${currentItem.venue_id}/${timestamp}_${randomString}_${updates.image.name}`;
        
        console.log('Uploading new menu item image to:', fileName);
        const imageUrl = await this.supabaseService.uploadFile('menu-item-images', fileName, updates.image);
        console.log('Uploaded new menu item image URL:', imageUrl);
        updateData.image_url = imageUrl;
      }
    }

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.is_available !== undefined) updateData.is_available = updates.is_available;

    const { data, error } = await this.supabaseService.client
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data as MenuItem;
  }

  /**
   * Delete a menu item
   */
  async deleteMenuItem(itemId: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  /**
   * Get menu item by ID
   */
  async getMenuItemById(itemId: string): Promise<MenuItem> {
    const { data, error } = await this.supabaseService.client
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return data as MenuItem;
  }

  /**
   * Get menu items for a venue
   */
  async getMenuItems(venueId: string): Promise<MenuItem[]> {
    const { data, error } = await this.supabaseService.client
      .from('menu_items')
      .select('*')
      .eq('venue_id', venueId)
      .order('category', { ascending: true });

    if (error) throw error;
    return data as MenuItem[];
  }

  /**
   * Get top rated menu items globally with venue information
   */
  async getTopMenuItems(limit: number = 5): Promise<MenuItem[]> {
    const { data, error } = await this.supabaseService.client
      .from('menu_items')
      .select(`
        *,
        venue:venues(name, city, state)
      `)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      ...item,
      venue: item.venue ? {
        name: item.venue.name,
        city: item.venue.city,
        state: item.venue.state
      } : undefined
    })) as MenuItem[];
  }
}