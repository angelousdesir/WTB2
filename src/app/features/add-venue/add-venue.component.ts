import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { AuthService } from '../../core/services/auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-add-venue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-venue.component.html',
  styleUrls: ['./add-venue.component.scss']
})
export class AddVenueComponent implements OnInit {
  venueForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  loading = false;
  errorMessage = '';

  cuisineTypes = [
    'American',
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Thai',
    'Indian',
    'Mediterranean',
    'French',
    'Spanish',
    'Greek',
    'Korean',
    'Vietnamese',
    'BBQ',
    'Steakhouse',
    'Seafood',
    'Pizza',
    'Burgers',
    'Sushi',
    'Cafe',
    'Bar & Grill',
    'Pub',
    'Sports Bar',
    'Brewery',
    'Wine Bar',
    'Cocktail Bar',
    'Fast Food',
    'Vegetarian',
    'Vegan',
    'Fusion',
    'Other'
  ];

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private fb: FormBuilder,
    private venueService: VenueService,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {
    this.venueForm = this.fb.group({
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

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      this.selectedImage = file;

      // Create preview
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
    if (this.venueForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.venueForm.controls).forEach(key => {
        this.venueForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const formValue = this.venueForm.value;
      
      const venue = await this.venueService.createVenue({
        name: formValue.name,
        description: formValue.description,
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        zip_code: formValue.zip_code,
        phone: formValue.phone,
        website: formValue.website,
        image: this.selectedImage || undefined,
        cuisine_type: formValue.cuisine_type
      });

      alert('Venue created successfully!');
      this.router.navigate(['/by-bar', venue.id]);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to create venue. Please try again.';
      console.error('Error creating venue:', error);
    } finally {
      this.loading = false;
    }
  }

  // Helper method to check if a field has an error
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.venueForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  goBack(): void {
    this.location.back();
  }
}