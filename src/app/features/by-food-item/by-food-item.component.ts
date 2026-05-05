import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { VenueService } from '../../core/services/venue.service';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem } from '../../core/models/menu-item.model';

@Component({
  selector: 'app-by-food-item',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './by-food-item.component.html',
  styleUrls: ['./by-food-item.component.scss']
})
export class ByFoodItemComponent implements OnInit {
  menuItems: MenuItem[] = [];
  allMenuItems: MenuItem[] = [];
  loading = true;
  searchQuery = '';
  selectedCategory = 'all';

  // Edit menu item properties
  showEditMenuItemModal = false;
  editMenuItemForm!: FormGroup;
  selectedMenuItem: MenuItem | null = null;
  savingMenuItem = false;
  selectedMenuItemImage: File | null = null;
  menuItemImagePreview: string | null = null;

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

  menuCategories = [
    'Appetizers', 'Main Course', 'Desserts', 'Drinks', 'Cocktails', 
    'Beer', 'Wine', 'Uncategorized', 'Other'
  ];

  constructor(
    private menuParserService: MenuParserService,
    private venueService: VenueService,
    public authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initEditMenuItemForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadTopItems();
  }

  initEditMenuItemForm(): void {
    this.editMenuItemForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: ['', [Validators.pattern(/^\d+\.?\d{0,2}$/)]],
      category: ['', [Validators.required]],
      is_available: [true]
    });
  }

  async loadTopItems(): Promise<void> {
    this.loading = true;
    try {
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

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category === this.selectedCategory
      );
    }

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
    return this.categories;
  }

  getCategoryCount(category: string): number {
    if (category === 'all') {
      return this.allMenuItems.length;
    }
    return this.allMenuItems.filter(item => item.category === category).length;
  }

  // Check if current user can edit this menu item
  async canEditMenuItem(item: MenuItem): Promise<boolean> {
    if (!this.authService.isAuthenticated()) return false;
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    // Admins can edit any item
    if (currentUser.role === 'admin') return true;

    // Owners can only edit items from their venues
    if (currentUser.role === 'owner') {
      try {
        const isOwner = await this.venueService.isVenueOwner(item.venue_id);
        return isOwner;
      } catch (error) {
        console.error('Error checking ownership:', error);
        return false;
      }
    }

    return false;
  }

  // Open edit modal for menu item
  async openEditMenuItemModal(item: MenuItem): Promise<void> {
    const canEdit = await this.canEditMenuItem(item);
    
    if (!canEdit) {
      alert('You can only edit menu items from venues you own.');
      return;
    }

    this.selectedMenuItem = item;
    this.editMenuItemForm.patchValue({
      name: item.name,
      description: item.description || '',
      price: item.price || '',
      category: item.category || 'Uncategorized',
      is_available: item.is_available !== false
    });
    this.showEditMenuItemModal = true;
  }

  closeEditMenuItemModal(): void {
   this.showEditMenuItemModal = false;
  this.editMenuItemForm.reset();
  this.selectedMenuItem = null;
  this.selectedMenuItemImage = null;
  this.menuItemImagePreview = null;
  }

  async saveMenuItemChanges(): Promise<void> {
    if (!this.selectedMenuItem || this.editMenuItemForm.invalid) {
      Object.keys(this.editMenuItemForm.controls).forEach(key => {
        this.editMenuItemForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.savingMenuItem = true;

    try {
      const formValue = this.editMenuItemForm.value;
      
      const updatedItem = await this.menuParserService.updateMenuItem(
        this.selectedMenuItem.id,
        {
          name: formValue.name,
          description: formValue.description || undefined,
          price: formValue.price ? parseFloat(formValue.price) : undefined,
          category: formValue.category,
          is_available: formValue.is_available
        }
      );

      // Update in local arrays
      const allIndex = this.allMenuItems.findIndex(i => i.id === updatedItem.id);
      if (allIndex !== -1) {
        this.allMenuItems[allIndex] = updatedItem;
      }

      const filteredIndex = this.menuItems.findIndex(i => i.id === updatedItem.id);
      if (filteredIndex !== -1) {
        this.menuItems[filteredIndex] = updatedItem;
      }

      alert('Menu item updated successfully!');
      this.closeEditMenuItemModal();
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      alert(error.message || 'Failed to update menu item. Please try again.');
    } finally {
      this.savingMenuItem = false;
    }
  }

  async deleteMenuItem(item: MenuItem, event: Event): Promise<void> {
    event.stopPropagation();

    const canEdit = await this.canEditMenuItem(item);
    
    if (!canEdit) {
      alert('You can only delete menu items from venues you own.');
      return;
    }

    const confirm = window.confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirm) return;

    try {
      await this.menuParserService.deleteMenuItem(item.id);
      
      // Remove from local arrays
      this.allMenuItems = this.allMenuItems.filter(i => i.id !== item.id);
      this.menuItems = this.menuItems.filter(i => i.id !== item.id);
      
      alert('Menu item deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      alert(error.message || 'Failed to delete menu item. Please try again.');
    }
  }

  hasMenuItemError(fieldName: string, errorType?: string): boolean {
    const field = this.editMenuItemForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  navigateToVenue(venueId: string): void {
    this.router.navigate(['/by-bar', venueId]);
  }

  navigateToMenuItem(itemId: string): void {
  this.router.navigate(['/menu-item', itemId]);
  }

  onMenuItemImageSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    this.selectedMenuItemImage = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.menuItemImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

  removeMenuItemImage(): void {
    this.selectedMenuItemImage = null;
    this.menuItemImagePreview = this.selectedMenuItem?.image_url || null;
  }
}