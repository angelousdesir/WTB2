import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss']
})
export class MyReviewsComponent implements OnInit {
  myPosts: Post[] = [];
  loading = true;
  stats = {
    totalReviews: 0,
    averageRating: 0,
    venuesReviewed: 0
  };

  constructor(
    private postService: PostService,
    public authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadMyPosts();
  }

  async loadMyPosts(): Promise<void> {
    this.loading = true;
    try {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) return;

      this.myPosts = await this.postService.getPostsByUser(currentUser.id);
      this.calculateStats();
    } catch (error) {
      console.error('Error loading my posts:', error);
    } finally {
      this.loading = false;
    }
  }

  calculateStats(): void {
    this.stats.totalReviews = this.myPosts.length;
    
    if (this.myPosts.length > 0) {
      const totalRating = this.myPosts.reduce((sum, post) => sum + post.rating, 0);
      this.stats.averageRating = totalRating / this.myPosts.length;

      const uniqueVenues = new Set(this.myPosts.map(post => post.venue_id));
      this.stats.venuesReviewed = uniqueVenues.size;
    }
  }

  async onEditPost(post: Post): Promise<void> {
    this.router.navigate(['/edit-post', post.id]);
  }

  async onDeletePost(post: Post): Promise<void> {
    try {
      await this.postService.deletePost(post.id);
      this.myPosts = this.myPosts.filter(p => p.id !== post.id);
      this.calculateStats();
      alert('Review deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete review.');
    }
  }

  get ratingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }
}