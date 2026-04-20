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
      // Perform OCR on the image
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
   * Parse menu text into structured items
   */
  parseMenuText(text: string): ParsedMenuItem[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const items: ParsedMenuItem[] = [];
    let currentCategory = 'Uncategorized';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect category headers (usually all caps or followed by divider)
      if (this.isCategoryHeader(line)) {
        currentCategory = line;
        continue;
      }

      // Try to extract item name, description, and price
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

  /**
   * Check if line is a category header
   */
  private isCategoryHeader(line: string): boolean {
    // Headers are usually short, all caps, or contain certain keywords
    const categoryKeywords = ['appetizers', 'entrees', 'mains', 'desserts', 'drinks', 'beverages', 'starters', 'salads', 'soups'];
    const isAllCaps = line === line.toUpperCase() && line.length < 30;
    const containsKeyword = categoryKeywords.some(keyword => line.toLowerCase().includes(keyword));
    
    return isAllCaps || containsKeyword;
  }

  /**
   * Parse individual menu item line
   */
  private parseMenuItem(line: string): ParsedMenuItem | null {
    // Price pattern: $X.XX or X.XX
    const pricePattern = /\$?(\d+\.\d{2})/;
    const priceMatch = line.match(pricePattern);

    if (!priceMatch) {
      return null; // Skip lines without prices
    }

    const price = parseFloat(priceMatch[1]);
    
    // Remove price from line to get name and description
    const nameAndDesc = line.replace(pricePattern, '').trim();
    
    // Split by common delimiters
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
    const menuItems = items.map(item => ({
      venue_id: venueId,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category || 'Uncategorized',
      average_rating: 0,
      total_reviews: 0,
      is_available: true,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await this.supabaseService.client
      .from('menu_items')
      .insert(menuItems)
      .select();

    if (error) throw error;
    return data as MenuItem[];
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
    
    // Transform the data to match our MenuItem interface
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