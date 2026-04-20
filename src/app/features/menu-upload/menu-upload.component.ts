import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
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
  venues: Venue[] = [];
  selectedMenuFile: File | null = null;
  parsedItems: ParsedMenuItem[] = [];
  loading = false;
  parsing = false;
  uploadStep: 'select' | 'preview' | 'success' = 'select';

  constructor(
    private fb: FormBuilder,
    private venueService: VenueService,
    private menuParserService: MenuParserService,
    private router: Router
  ) {
    this.menuForm = this.fb.group({
      venue_id: ['', Validators.required]
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

  onMenuFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      this.selectedMenuFile = file;
    }
  }

  async parseMenu(): Promise<void> {
    if (!this.selectedMenuFile || !this.menuForm.get('venue_id')?.value) {
      alert('Please select a venue and upload a menu image');
      return;
    }

    this.parsing = true;

    try {
      this.parsedItems = await this.menuParserService.parseMenuImage(this.selectedMenuFile);
      
      if (this.parsedItems.length === 0) {
        alert('No menu items detected. Please try a clearer image or enter items manually.');
        return;
      }

      this.uploadStep = 'preview';
    } catch (error: any) {
      alert(error.message || 'Failed to parse menu. Please try again.');
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

    try {
      const venueId = this.menuForm.get('venue_id')?.value;
      await this.menuParserService.saveMenuItems(venueId, this.parsedItems);
      
      this.uploadStep = 'success';
      
      setTimeout(() => {
        this.router.navigate(['/by-bar', venueId]);
      }, 2000);
    } catch (error: any) {
      alert(error.message || 'Failed to save menu items');
    } finally {
      this.loading = false;
    }
  }

  resetUpload(): void {
    this.selectedMenuFile = null;
    this.parsedItems = [];
    this.uploadStep = 'select';
    this.menuForm.reset();
  }
}