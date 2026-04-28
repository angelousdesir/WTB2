import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { AuthService } from '../../core/services/auth.service';
import { Venue } from '../../core/models/venue.model';
import { ParsedMenuItem } from '../../core/models/menu-item.model';

@Component({
  selector: 'app-menu-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-upload.component.html',
  styleUrls: ['./menu-upload.component.scss']
})
export class MenuUploadComponent implements OnInit {
  menuForm: FormGroup;
  manualEntryForm: FormGroup;
  venues: Venue[] = [];
  selectedMenuFile: File | null = null;
  parsedItems: ParsedMenuItem[] = [];
  loading = false;
  parsing = false;
  uploadStep: 'select' | 'preview' | 'success' = 'select';
  errorMessage = '';
  uploadMode: 'auto' | 'manual' = 'auto';

  categories = [
    'Appetizers',
    'Main Course',
    'Desserts',
    'Drinks',
    'Cocktails',
    'Beer',
    'Wine',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private venueService: VenueService,
    private menuParserService: MenuParserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.menuForm = this.fb.group({
      venue_id: ['', Validators.required]
    });

    this.manualEntryForm = this.fb.group({
      venue_id: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadVenues();
  }

  async loadVenues(): Promise<void> {
    try {
      const currentUser = this.authService.currentUserValue;
      
      if (!currentUser) {
        this.router.navigate(['/login']);
        return;
      }

      if (currentUser.role === 'admin') {
        this.venues = await this.venueService.getVenues(0, 1000);
      } else if (currentUser.role === 'owner') {
        this.venues = await this.venueService.getMyVenues();
      } else {
        alert('Only venue owners can upload menus. Please contact the venue owner.');
        this.router.navigate(['/by-bar']);
        return;
      }

      if (this.venues.length === 0) {
        this.errorMessage = 'You need to create a venue first before uploading a menu.';
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      this.errorMessage = 'Failed to load venues. Please try again.';
    }
  }

  get menuItems(): FormArray {
    return this.manualEntryForm.get('items') as FormArray;
  }

  addMenuItem(): void {
    const itemGroup = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', [Validators.pattern(/^\d+\.?\d{0,2}$/)]],
      category: ['', Validators.required]
    });

    this.menuItems.push(itemGroup);
  }

  removeMenuItem(index: number): void {
    this.menuItems.removeAt(index);
  }

  switchToManualMode(): void {
    this.uploadMode = 'manual';
    // Copy venue selection
    const venueId = this.menuForm.get('venue_id')?.value;
    this.manualEntryForm.patchValue({ venue_id: venueId });
    
    // Add initial empty item
    if (this.menuItems.length === 0) {
      this.addMenuItem();
    }
  }

  switchToAutoMode(): void {
    this.uploadMode = 'auto';
    // Copy venue selection
    const venueId = this.manualEntryForm.get('venue_id')?.value;
    this.menuForm.patchValue({ venue_id: venueId });
  }

  onMenuFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Accept images and PDFs
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Please select an image or PDF file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      this.selectedMenuFile = file;
      this.errorMessage = '';
    }
  }

  async parseMenu(): Promise<void> {
    if (!this.selectedMenuFile || !this.menuForm.get('venue_id')?.value) {
      alert('Please select a venue and upload a menu file');
      return;
    }

    const venueId = this.menuForm.get('venue_id')?.value;
    
    const isOwner = await this.venueService.isVenueOwner(venueId);
    if (!isOwner) {
      alert('You can only upload menus for venues you own.');
      return;
    }

    this.parsing = true;
    this.errorMessage = '';

    try {
      // Check if it's a PDF
      if (this.selectedMenuFile.type === 'application/pdf') {
        this.parsedItems = await this.menuParserService.parsePdfMenu(this.selectedMenuFile);
      } else {
        this.parsedItems = await this.menuParserService.parseMenuImage(this.selectedMenuFile);
      }
      
      if (this.parsedItems.length === 0) {
        alert('No menu items detected. Please try manual entry or a clearer file.');
        return;
      }

      this.uploadStep = 'preview';
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to parse menu. Please try again or use manual entry.';
      console.error('Parse error:', error);
    } finally {
      this.parsing = false;
    }
  }

  removeItem(index: number): void {
    this.parsedItems.splice(index, 1);
  }

  async saveMenuItems(): Promise<void> {
    if (this.parsedItems.length === 0) {
      alert('No items to save');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const venueId = this.menuForm.get('venue_id')?.value;
      
      const isOwner = await this.venueService.isVenueOwner(venueId);
      if (!isOwner) {
        throw new Error('You can only upload menus for venues you own.');
      }

      await this.menuParserService.saveMenuItems(venueId, this.parsedItems);
      
      this.uploadStep = 'success';
      
      setTimeout(() => {
        this.router.navigate(['/by-bar', venueId]);
      }, 2000);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save menu items';
      console.error('Save error:', error);
    } finally {
      this.loading = false;
    }
  }

  async saveManualMenuItems(): Promise<void> {
    if (this.manualEntryForm.invalid || this.menuItems.length === 0) {
      alert('Please fill in all required fields');
      Object.keys(this.manualEntryForm.controls).forEach(key => {
        this.manualEntryForm.get(key)?.markAsTouched();
      });
      this.menuItems.controls.forEach(control => {
        Object.keys(control.value).forEach(key => {
          control.get(key)?.markAsTouched();
        });
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const venueId = this.manualEntryForm.get('venue_id')?.value;
      
      const isOwner = await this.venueService.isVenueOwner(venueId);
      if (!isOwner) {
        throw new Error('You can only upload menus for venues you own.');
      }

      // Convert form data to ParsedMenuItem format
      const items: ParsedMenuItem[] = this.menuItems.value.map((item: any) => ({
        name: item.name,
        description: item.description || undefined,
        price: item.price ? parseFloat(item.price) : undefined,
        category: item.category
      }));

      await this.menuParserService.saveMenuItems(venueId, items);
      
      this.uploadStep = 'success';
      
      setTimeout(() => {
        this.router.navigate(['/by-bar', venueId]);
      }, 2000);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save menu items';
      console.error('Save error:', error);
    } finally {
      this.loading = false;
    }
  }

  resetUpload(): void {
    this.selectedMenuFile = null;
    this.parsedItems = [];
    this.uploadStep = 'select';
    this.menuForm.reset();
    this.manualEntryForm = this.fb.group({
      venue_id: ['', Validators.required],
      items: this.fb.array([])
    });
    this.errorMessage = '';
    this.uploadMode = 'auto';
  }
}