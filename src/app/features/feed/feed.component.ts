import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { TopItemsSidebarComponent } from '../../shared/components/top-items-sidebar/top-items-sidebar.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, TopItemsSidebarComponent],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  loading = true;
  loadingMore = false;
  currentPage = 0;
  hasMore = true;

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

    await this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    this.loading = true;
    try {
      this.posts = await this.postService.getPosts(0, 20);
      this.currentPage = 0;
      this.hasMore = this.posts.length === 20;
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadMorePosts(): Promise<void> {
    if (this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    try {
      const nextPage = this.currentPage + 1;
      const morePosts = await this.postService.getPosts(nextPage, 20);
      
      if (morePosts.length > 0) {
        this.posts = [...this.posts, ...morePosts];
        this.currentPage = nextPage;
        this.hasMore = morePosts.length === 20;
      } else {
        this.hasMore = false;
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      this.loadingMore = false;
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loading || this.loadingMore || !this.hasMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 500) {
      this.loadMorePosts();
    }
  }

  async onEditPost(post: Post): Promise<void> {
    // Navigate to edit page (we'll create this next)
    this.router.navigate(['/edit-post', post.id]);
  }

  async onDeletePost(post: Post): Promise<void> {
    try {
      await this.postService.deletePost(post.id);
      this.posts = this.posts.filter(p => p.id !== post.id);
      alert('Post deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post.');
    }
  }
}