import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { VenueService } from '../../core/services/venue.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { AuthService } from '../../core/services/auth.service';
import { Venue } from '../../core/models/venue.model';
import { MenuItem } from '../../core/models/menu-item.model';
import { CreatePostDto } from '../../core/models/post.model';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit {
  postForm: FormGroup;
  venues: Venue[] = [];
  menuItems: MenuItem[] = [];
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private venueService: VenueService,
    private menuParserService: MenuParserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.postForm = this.fb.group({
      venue_id: ['', Validators.required],
      menu_item_id: [''],
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadVenues();

    // Check for query params (pre-selected venue/menu item)
    const venueId = this.route.snapshot.queryParamMap.get('venueId');
    const menuItemId = this.route.snapshot.queryParamMap.get('menuItemId');

    if (venueId) {
      this.postForm.patchValue({ venue_id: venueId });
      await this.onVenueChange();
      
      if (menuItemId) {
        this.postForm.patchValue({ menu_item_id: menuItemId });
      }
    }
  }

  async loadVenues(): Promise<void> {
    try {
      this.venues = await this.venueService.getVenues(0, 100);
    } catch (error) {
      console.error('Error loading venues:', error);
      this.errorMessage = 'Failed to load venues.';
    }
  }

  async onVenueChange(): Promise<void> {
    const venueId = this.postForm.get('venue_id')?.value;
    
    if (venueId) {
      try {
        this.menuItems = await this.menuParserService.getMenuItems(venueId);
      } catch (error) {
        console.error('Error loading menu items:', error);
        this.menuItems = [];
      }
    } else {
      this.menuItems = [];
    }
    
    // Reset menu item selection when venue changes
    this.postForm.patchValue({ menu_item_id: '' });
  }

  onImageSelect(event: Event): void {
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

      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  async onSubmit(): Promise<void> {
    if (this.postForm.invalid) {
      Object.keys(this.postForm.controls).forEach(key => {
        this.postForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const formValue = this.postForm.value;

      const postData: CreatePostDto = {
        venue_id: formValue.venue_id,
        menu_item_id: formValue.menu_item_id || undefined,
        title: formValue.title,
        content: formValue.content,
        rating: formValue.rating,
        image: this.selectedImage || undefined
      };

      await this.postService.createPost(postData);

      alert('Post created successfully!');
      this.router.navigate(['/feed']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to create post. Please try again.';
      console.error('Error creating post:', error);
    } finally {
      this.loading = false;
    }
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.postForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  get ratingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  setRating(rating: number): void {
    this.postForm.patchValue({ rating });
  }
}