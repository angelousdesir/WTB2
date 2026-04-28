import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem } from '../../core/models/menu-item.model';

@Component({
  selector: 'app-by-food-item',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './by-food-item.component.html',
  styleUrls: ['./by-food-item.component.scss']
})
export class ByFoodItemComponent implements OnInit {
  menuItems: MenuItem[] = [];
  allMenuItems: MenuItem[] = []; // Store all items for filtering
  loading = true;
  searchQuery = '';
  selectedCategory = 'all';

  categories = [
    { value: 'all', label: 'All Categories', icon: '🍽️' },
    { value: 'Appetizers', label: 'Appetizers', icon: '🥗' },
    { value: 'Main Course', label: 'Main Course', icon: '🍖' },
    { value: 'Desserts', label: 'Desserts', icon: '🍰' },
    { value: 'Drinks', label: 'Drinks', icon: '🥤' },
    { value: 'Cocktails', label: 'Cocktails', icon: '🍹' },
    { value: 'Beer', label: 'Beer', icon: '🍺' },
    { value: 'Wine', label: 'Wine', icon: '🍷' },
    { value: 'Uncategorized', label: 'Other', icon: '🍴' }
  ];

  constructor(
    private menuParserService: MenuParserService,
    public authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTopItems();
  }

  async loadTopItems(): Promise<void> {
    this.loading = true;
    try {
      // Show only first 5 items if not authenticated
      const limit = this.authService.isAuthenticated() ? 100 : 5;
      this.allMenuItems = await this.menuParserService.getTopMenuItems(limit);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.allMenuItems];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category === this.selectedCategory
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    this.menuItems = filtered;
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  get shouldShowLoginPrompt(): boolean {
    return !this.authService.isAuthenticated() && this.allMenuItems.length >= 5;
  }

  get availableCategories(): typeof this.categories {
    // Show all categories, but you could filter to only show categories with items
    return this.categories;
  }

  getCategoryCount(category: string): number {
    if (category === 'all') {
      return this.allMenuItems.length;
    }
    return this.allMenuItems.filter(item => item.category === category).length;
  }
}