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
      // Convert PDF pages to images and use OCR
      const arrayBuffer = await pdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // For now, we'll use a simple text extraction approach
      // You could enhance this with a library like pdf.js for better extraction
      const text = await this.extractTextFromPdf(uint8Array);
      return this.parseMenuText(text);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF menu. Please try uploading an image or entering items manually.');
    }
  }

  /**
   * Extract text from PDF (basic implementation)
   * For production, consider using pdf.js library
   */
  private async extractTextFromPdf(pdfData: Uint8Array): Promise<string> {
    // This is a simplified version
    // For full PDF support, you would use pdf.js:
    // npm install pdfjs-dist
    
    try {
      // Convert to blob and use FileReader as fallback
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const text = await this.convertPdfToText(blob);
      return text;
    } catch (error) {
      throw new Error('PDF text extraction failed. Please try manual entry.');
    }
  }

  /**
   * Convert PDF to text (placeholder - requires pdf.js for full implementation)
   */
  private async convertPdfToText(blob: Blob): Promise<string> {
    // This is a basic implementation
    // For production, implement proper PDF.js integration
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        // Basic text extraction (very limited)
        resolve(text || '');
      };
      reader.onerror = () => reject(new Error('Failed to read PDF'));
      reader.readAsText(blob);
    });
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

  /**
   * Check if line is a category header
   */
  private isCategoryHeader(line: string): boolean {
    const categoryKeywords = ['appetizers', 'entrees', 'mains', 'desserts', 'drinks', 'beverages', 'starters', 'salads', 'soups'];
    const isAllCaps = line === line.toUpperCase() && line.length < 30;
    const containsKeyword = categoryKeywords.some(keyword => line.toLowerCase().includes(keyword));
    
    return isAllCaps || containsKeyword;
  }

  /**
   * Parse individual menu item line
   */
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