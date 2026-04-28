import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { PostService } from '../../core/services/post.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { AuthService } from '../../core/services/auth.service';
import { Venue } from '../../core/models/venue.model';
import { Post } from '../../core/models/post.model';
import { MenuItem } from '../../core/models/menu-item.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { TopItemsSidebarComponent } from '../../shared/components/top-items-sidebar/top-items-sidebar.component';

@Component({
  selector: 'app-by-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PostCardComponent, TopItemsSidebarComponent],
  templateUrl: './by-bar.component.html',
  styleUrls: ['./by-bar.component.scss']
})
export class ByBarComponent implements OnInit {
  venues: Venue[] = [];
  selectedVenue: Venue | null = null;
  venuePosts: Post[] = [];
  venueMenuItems: MenuItem[] = [];
  loading = true;
  searchQuery = '';
  showRoleUpgradePrompt = false;
  upgradingRole = false;
  
  // Edit venue properties
  showEditModal = false;
  editVenueForm!: FormGroup;
  selectedEditImage: File | null = null;
  editImagePreview: string | null = null;
  savingVenue = false;

  cuisineTypes = [
    'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
    'Mediterranean', 'French', 'Spanish', 'Greek', 'Korean', 'Vietnamese',
    'BBQ', 'Steakhouse', 'Seafood', 'Pizza', 'Burgers', 'Sushi', 'Cafe',
    'Bar & Grill', 'Pub', 'Sports Bar', 'Brewery', 'Wine Bar', 'Cocktail Bar',
    'Fast Food', 'Vegetarian', 'Vegan', 'Fusion', 'Other'
  ];

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private venueService: VenueService,
    private postService: PostService,
    private menuParserService: MenuParserService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.initEditForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadVenues();
    
    const venueId = this.route.snapshot.paramMap.get('id');
    if (venueId) {
      const venue = this.venues.find(v => v.id === venueId);
      if (venue) {
        await this.selectVenue(venue);
      }
    }
  }

  initEditForm(): void {
    this.editVenueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.maxLength(500)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip_code: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      phone: ['', [Validators.pattern(/^[\d\s\-\(\)]+$/)]],
      website: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]],
      cuisine_type: ['']
    });
  }

  async loadVenues(): Promise<void> {
    this.loading = true;
    try {
      const limit = this.authService.isAuthenticated() ? 100 : 5;
      this.venues = await this.venueService.getVenues(0, limit);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectVenue(venue: Venue): Promise<void> {
    this.selectedVenue = venue;
    this.router.navigate(['/by-bar', venue.id]);
    
    try {
      const [posts, menuItems] = await Promise.all([
        this.postService.getPostsByVenue(venue.id),
        this.menuParserService.getMenuItems(venue.id)
      ]);
      this.venuePosts = posts;
      this.venueMenuItems = menuItems;
    } catch (error) {
      console.error('Error loading venue details:', error);
    }
  }

  get filteredVenues(): Venue[] {
    if (!this.searchQuery) {
      return this.venues;
    }
    return this.venues.filter(venue =>
      venue.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      venue.cuisine_type?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  clearSelection(): void {
    this.selectedVenue = null;
    this.venuePosts = [];
    this.venueMenuItems = [];
    this.router.navigate(['/by-bar']);
  }

  navigateToAddVenue(): void {
    if (!this.authService.isAuthenticated()) {
      alert('Please sign in to add a venue');
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.isCustomer()) {
      this.showRoleUpgradePrompt = true;
      return;
    }

    this.router.navigate(['/add-venue']);
  }

  async upgradeToVenueOwner(): Promise<void> {
    this.upgradingRole = true;
    try {
      await this.authService.updateUserRole('owner');
      alert('Success! Your account has been upgraded to Venue Owner. You can now add and manage venues.');
      this.showRoleUpgradePrompt = false;
      this.router.navigate(['/add-venue']);
    } catch (error: any) {
      console.error('Error upgrading role:', error);
      alert(error.message || 'Failed to upgrade account. Please try again.');
    } finally {
      this.upgradingRole = false;
    }
  }

  cancelRoleUpgrade(): void {
    this.showRoleUpgradePrompt = false;
  }

  get shouldShowLoginPrompt(): boolean {
    return !this.authService.isAuthenticated() && this.venues.length >= 5;
  }

  // Check if current user can edit this venue
  canEditVenue(venue: Venue | null): boolean {
    if (!venue || !this.authService.isAuthenticated()) return false;
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    // Admins can edit any venue, owners can edit their own
    return currentUser.role === 'admin' || venue.owner_id === currentUser.id;
  }

  // Open edit modal
  openEditModal(): void {
    if (!this.selectedVenue) return;

    // Populate form with current venue data
    this.editVenueForm.patchValue({
      name: this.selectedVenue.name,
      description: this.selectedVenue.description || '',
      address: this.selectedVenue.address,
      city: this.selectedVenue.city,
      state: this.selectedVenue.state,
      zip_code: this.selectedVenue.zip_code,
      phone: this.selectedVenue.phone || '',
      website: this.selectedVenue.website || '',
      cuisine_type: this.selectedVenue.cuisine_type || ''
    });

    // Set current image as preview
    this.editImagePreview = this.selectedVenue.image_url || null;
    this.selectedEditImage = null;

    this.showEditModal = true;
  }

  // Close edit modal
  closeEditModal(): void {
    this.showEditModal = false;
    this.editVenueForm.reset();
    this.selectedEditImage = null;
    this.editImagePreview = null;
  }

  // Handle image selection for edit
  onEditImageSelect(event: Event): void {
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

      this.selectedEditImage = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.editImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Remove edit image
  removeEditImage(): void {
    this.selectedEditImage = null;
    this.editImagePreview = this.selectedVenue?.image_url || null;
  }

  // Save venue changes
  async saveVenueChanges(): Promise<void> {
    if (!this.selectedVenue || this.editVenueForm.invalid) {
      Object.keys(this.editVenueForm.controls).forEach(key => {
        this.editVenueForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.savingVenue = true;

    try {
      const formValue = this.editVenueForm.value;
      
      // Call update service (we'll add this method next)
      const updatedVenue = await this.venueService.updateVenue(
        this.selectedVenue.id,
        {
          name: formValue.name,
          description: formValue.description,
          address: formValue.address,
          city: formValue.city,
          state: formValue.state,
          zip_code: formValue.zip_code,
          phone: formValue.phone,
          website: formValue.website,
          cuisine_type: formValue.cuisine_type,
          image: this.selectedEditImage || undefined
        }
      );

      // Update the selected venue and venues list
      this.selectedVenue = updatedVenue;
      const index = this.venues.findIndex(v => v.id === updatedVenue.id);
      if (index !== -1) {
        this.venues[index] = updatedVenue;
      }

      alert('Venue updated successfully!');
      this.closeEditModal();
    } catch (error: any) {
      console.error('Error updating venue:', error);
      alert(error.message || 'Failed to update venue. Please try again.');
    } finally {
      this.savingVenue = false;
    }
  }

  // Helper method to check form errors
  hasEditError(fieldName: string, errorType?: string): boolean {
    const field = this.editVenueForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }
}