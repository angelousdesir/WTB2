import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { AuthService } from '../../core/services/auth.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { Venue } from '../../core/models/venue.model';

@Component({
  selector: 'app-my-venues',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-venues.component.html',
  styleUrls: ['./my-venues.component.scss']
})
export class MyVenuesComponent implements OnInit {
  venues: Venue[] = [];
  loading = true;
  venueMenuCounts: Map<string, number> = new Map();
  deletingVenueId: string | null = null;

  constructor(
    private venueService: VenueService,
    private authService: AuthService,
    private menuParserService: MenuParserService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadMyVenues();
  }

  async loadMyVenues(): Promise<void> {
    this.loading = true;
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
        alert('Only venue owners can access this page.');
        this.router.navigate(['/by-bar']);
        return;
      }

      await this.loadMenuCounts();
    } catch (error) {
      console.error('Error loading venues:', error);
      alert('Failed to load your venues. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  async loadMenuCounts(): Promise<void> {
    for (const venue of this.venues) {
      try {
        const menuItems = await this.menuParserService.getMenuItems(venue.id);
        this.venueMenuCounts.set(venue.id, menuItems.length);
      } catch (error) {
        console.error(`Error loading menu count for venue ${venue.id}:`, error);
        this.venueMenuCounts.set(venue.id, 0);
      }
    }
  }

  getMenuCount(venueId: string): number {
    return this.venueMenuCounts.get(venueId) || 0;
  }

  navigateToVenue(venueId: string): void {
    this.router.navigate(['/by-bar', venueId]);
  }

  navigateToAddVenue(): void {
    this.router.navigate(['/add-venue']);
  }

  navigateToUploadMenu(venueId: string): void {
    this.router.navigate(['/menu-upload'], { queryParams: { venueId } });
  }

  async deleteVenue(venue: Venue, event: Event): Promise<void> {
    event.stopPropagation();

    const confirm = window.confirm(
      `Are you sure you want to delete "${venue.name}"?\n\nThis will also delete all menu items and reviews associated with this venue. This action cannot be undone.`
    );

    if (!confirm) return;

    this.deletingVenueId = venue.id;

    try {
      await this.venueService.deleteVenue(venue.id);
      
      this.venues = this.venues.filter(v => v.id !== venue.id);
      this.venueMenuCounts.delete(venue.id);

      alert('Venue deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      alert(error.message || 'Failed to delete venue. Please try again.');
    } finally {
      this.deletingVenueId = null;
    }
  }

  // Getter methods for computed values
  get totalVenues(): number {
    return this.venues.length;
  }

  get averageRating(): string {
    if (this.venues.length === 0) return '0.0';
    const total = this.venues.reduce((acc, venue) => acc + venue.average_rating, 0);
    return (total / this.venues.length).toFixed(1);
  }

  get totalReviews(): number {
    return this.venues.reduce((acc, venue) => acc + venue.total_reviews, 0);
  }
}