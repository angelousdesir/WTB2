import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VenueService } from '../../core/services/venue.service';
import { PostService } from '../../core/services/post.service';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { Venue } from '../../core/models/venue.model';
import { Post } from '../../core/models/post.model';
import { MenuItem } from '../../core/models/menu-item.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { TopItemsSidebarComponent } from '../../shared/components/top-items-sidebar/top-items-sidebar.component';

@Component({
  selector: 'app-by-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PostCardComponent, TopItemsSidebarComponent],
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

  constructor(
    private venueService: VenueService,
    private postService: PostService,
    private menuParserService: MenuParserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

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

  async loadVenues(): Promise<void> {
    this.loading = true;
    try {
      this.venues = await this.venueService.getVenues(0, 100);
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
    this.router.navigate(['/add-venue']);
  }
}