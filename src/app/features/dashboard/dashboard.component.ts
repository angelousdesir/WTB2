import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { VenueService } from '../../core/services/venue.service';
import { PostService } from '../../core/services/post.service';
import { Venue } from '../../core/models/venue.model';
import { Post } from '../../core/models/post.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = true;
  userName = '';
  userRole = '';
  myVenues: Venue[] = [];
  recentPosts: Post[] = [];
  topVenues: Venue[] = [];

  quickActions = [
    { icon: '🏪', label: 'Browse Venues', route: '/by-bar', color: '#1D4ED8' },
    { icon: '🍽️', label: 'Browse Food Items', route: '/by-food-item', color: '#D4AF37' },
    { icon: '📝', label: 'Create Post', route: '/create-post', color: '#FBBF24' },
    { icon: '🎭', label: 'Browse by Genre', route: '/by-genre', color: '#8B5CF6' }
  ];

  ownerActions = [
    { icon: '➕', label: 'Add Venue', route: '/add-venue', color: '#10B981' },
    { icon: '🏢', label: 'My Venues', route: '/my-venues', color: '#3B82F6' },
    { icon: '📋', label: 'Upload Menu', route: '/menu-upload', color: '#F59E0B' }
  ];

  constructor(
    public authService: AuthService,
    private venueService: VenueService,
    private postService: PostService,
    private router: Router,
    private location: Location,
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUserValue;
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = user.username || user.email.split('@')[0];
    this.userRole = user.role || 'customer';

    await this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loading = true;
    
    try {
      // Load top venues
      this.topVenues = await this.venueService.getTopVenues(3);

      // Load recent posts
      this.recentPosts = await this.postService.getPosts(0, 6);

      // If user is owner, load their venues
      if (this.isOwner) {
        this.myVenues = await this.venueService.getMyVenues();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  get isOwner(): boolean {
    return this.userRole === 'owner' || this.userRole === 'admin';
  }

  get isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  navigateToVenue(venueId: string): void {
    this.router.navigate(['/by-bar', venueId]);
  }

  goBack(): void {
    this.location.back();
  }
}