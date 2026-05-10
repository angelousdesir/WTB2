import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

interface CategoryInfo {
  name: string;
  displayName: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-by-genre',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './by-genre.component.html',
  styleUrls: ['./by-genre.component.scss']
})
export class ByGenreComponent implements OnInit {
  categories: CategoryInfo[] = [
    { 
      name: 'Appetizers', 
      displayName: 'Appetizers', 
      icon: '🥗',
      description: 'Start your meal right'
    },
    { 
      name: 'Main Course', 
      displayName: 'Main Courses', 
      icon: '🍖',
      description: 'Hearty and satisfying'
    },
    { 
      name: 'Desserts', 
      displayName: 'Desserts', 
      icon: '🍰',
      description: 'Sweet endings'
    },
    { 
      name: 'Drinks', 
      displayName: 'Drinks', 
      icon: '🥤',
      description: 'Refreshing beverages'
    },
    { 
      name: 'Cocktails', 
      displayName: 'Cocktails', 
      icon: '🍹',
      description: 'Craft cocktails'
    },
    { 
      name: 'Beer', 
      displayName: 'Beer', 
      icon: '🍺',
      description: 'Brews and ales'
    },
    { 
      name: 'Wine', 
      displayName: 'Wine', 
      icon: '🍷',
      description: 'Fine wines'
    }
  ];

  selectedCategory: CategoryInfo | null = null;
  categoryPosts: Post[] = [];
  loading = false;

  constructor(
    private postService: PostService,
    public authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  async selectCategory(category: CategoryInfo): Promise<void> {
    this.selectedCategory = category;
    this.loading = true;

    try {
      this.categoryPosts = await this.postService.getPostsByCategory(category.name);
    } catch (error) {
      console.error('Error loading category posts:', error);
      alert('Failed to load posts for this category.');
    } finally {
      this.loading = false;
    }
  }

  clearSelection(): void {
    this.selectedCategory = null;
    this.categoryPosts = [];
  }

  goBack(): void {
    this.location.back();
  }
}