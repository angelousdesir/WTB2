import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { PostService } from '../../core/services/post.service';
import { VenueService } from '../../core/services/venue.service';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { Post } from '../../core/models/post.model';
import { Venue } from '../../core/models/venue.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-menu-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './menu-item-detail.component.html',
  styleUrls: ['./menu-item-detail.component.scss']
})
export class MenuItemDetailComponent implements OnInit {
  menuItem: MenuItem | null = null;
  venue: Venue | null = null;
  reviews: Post[] = [];
  loading = true;
  itemId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private menuParserService: MenuParserService,
    private postService: PostService,
    private venueService: VenueService,
    public authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.itemId) {
      this.router.navigate(['/by-food-item']);
      return;
    }

    await this.loadMenuItemDetails();
  }

  async loadMenuItemDetails(): Promise<void> {
    this.loading = true;
    
    try {
      // Load menu item
      this.menuItem = await this.menuParserService.getMenuItemById(this.itemId);
      
      // Load venue information
      if (this.menuItem.venue_id) {
        this.venue = await this.venueService.getVenueById(this.menuItem.venue_id);
      }

      // Load reviews for this menu item
      this.reviews = await this.postService.getPostsByMenuItem(this.itemId);
      
    } catch (error) {
      console.error('Error loading menu item details:', error);
      alert('Failed to load menu item details. Redirecting...');
      this.router.navigate(['/by-food-item']);
    } finally {
      this.loading = false;
    }
  }

  navigateToVenue(): void {
    if (this.venue) {
      this.router.navigate(['/by-bar', this.venue.id]);
    }
  }

  navigateToCreateReview(): void {
    this.router.navigate(['/create-post'], { 
      queryParams: { 
        menuItemId: this.itemId,
        venueId: this.menuItem?.venue_id 
      } 
    });
  }

  goBack(): void {
    this.location.back();
  }

  get ratingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  get averageRating(): number {
    return this.menuItem?.average_rating || 0;
  }

  get totalReviews(): number {
    return this.menuItem?.total_reviews || 0;
  }
}