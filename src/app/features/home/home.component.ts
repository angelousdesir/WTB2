import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { VenueService } from '../../core/services/venue.service';
import { Post } from '../../core/models/post.model';
import { Venue } from '../../core/models/venue.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  recentPosts: Post[] = [];
  topVenues: Venue[] = [];
  loading = true;

  constructor(
    private postService: PostService,
    private venueService: VenueService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [posts, venues] = await Promise.all([
        this.postService.getPosts(0, 6),
        this.venueService.getTopVenues(3)
      ]);
      this.recentPosts = posts;
      this.topVenues = venues;
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToFeed(): void {
    this.router.navigate(['/feed']);
  }

  navigateToVenue(venueId: string): void {
    this.router.navigate(['/by-bar', venueId]);
  }
}