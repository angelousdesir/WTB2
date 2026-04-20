import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { VenueService } from '../../core/services/venue.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { Venue } from '../../core/models/venue.model';
import { MenuItem } from '../../core/models/menu-item.model';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, RatingStarsComponent],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit {
  postForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  loading = false;
  venues: Venue[] = [];
  menuItems: MenuItem[] = [];
  selectedVenueId: string | null = null;
  rating = 0;

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
    private postService: PostService,
    private venueService: VenueService,
    private menuParserService: MenuParserService,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      caption: ['', [Validators.required, Validators.minLength(10)]],
      venue_id: [''],
      menu_item_id: [''],
      category: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadVenues();
  }

  async loadVenues(): Promise<void> {
    try {
      this.venues = await this.venueService.getVenues(0, 100);
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  }

  async onVenueChange(venueId: string): Promise<void> {
    this.selectedVenueId = venueId;
    if (venueId) {
      try {
        this.menuItems = await this.menuParserService.getMenuItems(venueId);
      } catch (error) {
        console.error('Error loading menu items:', error);
      }
    } else {
      this.menuItems = [];
    }
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

  onRatingChange(newRating: number): void {
    this.rating = newRating;
  }

  async onSubmit(): Promise<void> {
    if (this.postForm.invalid || this.rating === 0) {
      alert('Please fill in all required fields and select a rating');
      return;
    }

    this.loading = true;

    try {
      const formValue = this.postForm.value;
      
      await this.postService.createPost({
        caption: formValue.caption,
        image: this.selectedImage || undefined,
        rating: this.rating,
        venue_id: formValue.venue_id || undefined,
        menu_item_id: formValue.menu_item_id || undefined,
        category: formValue.category || undefined
      });

      alert('Post created successfully!');
      this.router.navigate(['/feed']);
    } catch (error: any) {
      alert(error.message || 'Failed to create post');
    } finally {
      this.loading = false;
    }
  }
}