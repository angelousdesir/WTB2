import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-by-genre',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './by-genre.component.html',
  styleUrls: ['./by-genre.component.scss']
})
export class ByGenreComponent implements OnInit {
  categories = [
    { name: 'Appetizers', icon: '🥗', color: '#10B981' },
    { name: 'Main Course', icon: '🍽️', color: '#F59E0B' },
    { name: 'Desserts', icon: '🍰', color: '#EC4899' },
    { name: 'Drinks', icon: '🥤', color: '#3B82F6' },
    { name: 'Cocktails', icon: '🍹', color: '#8B5CF6' },
    { name: 'Beer', icon: '🍺', color: '#EAB308' },
    { name: 'Wine', icon: '🍷', color: '#DC2626' },
    { name: 'Other', icon: '🍴', color: '#6B7280' }
  ];

  selectedCategory: string | null = null;
  categoryPosts: Post[] = [];
  loading = false;

  constructor(private postService: PostService) {}

  ngOnInit(): void {}

  async selectCategory(categoryName: string): Promise<void> {
    this.selectedCategory = categoryName;
    this.loading = true;

    try {
      this.categoryPosts = await this.postService.getPostsByCategory(categoryName);
    } catch (error) {
      console.error('Error loading category posts:', error);
    } finally {
      this.loading = false;
    }
  }

  clearSelection(): void {
    this.selectedCategory = null;
    this.categoryPosts = [];
  }
}