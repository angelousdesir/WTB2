import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { TopItemsSidebarComponent } from '../../shared/components/top-items-sidebar/top-items-sidebar.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, PostCardComponent, TopItemsSidebarComponent],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  loading = false;
  currentPage = 0;
  hasMore = true;

  constructor(private postService: PostService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    try {
      const newPosts = await this.postService.getPosts(this.currentPage, 20);
      
      if (newPosts.length < 20) {
        this.hasMore = false;
      }
      
      this.posts = [...this.posts, ...newPosts];
      this.currentPage++;
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      this.loading = false;
    }
  }

 
 @HostListener('window:scroll', ['$event']) 
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= pageHeight * 0.8 && !this.loading && this.hasMore) {
      this.loadPosts();
    }
  }


  async onDeletePost(postId: string): Promise<void> {
    try {
      await this.postService.deletePost(postId);
      this.posts = this.posts.filter(p => p.id !== postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }
}