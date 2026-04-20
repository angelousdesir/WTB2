import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuParserService } from '../../core/services/menu-parser.service';
import { PostService } from '../../core/services/post.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { TopItemsSidebarComponent } from '../../shared/components/top-items-sidebar/top-items-sidebar.component';

@Component({
  selector: 'app-by-food-item',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent, TopItemsSidebarComponent],
  templateUrl: './by-food-item.component.html',
  styleUrls: ['./by-food-item.component.scss']
})
export class ByFoodItemComponent implements OnInit {
  menuItems: MenuItem[] = [];
  selectedItem: MenuItem | null = null;
  itemPosts: Post[] = [];
  loading = true;
  searchQuery = '';

  constructor(
    private menuParserService: MenuParserService,
    private postService: PostService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTopItems();
  }

  async loadTopItems(): Promise<void> {
    this.loading = true;
    try {
      this.menuItems = await this.menuParserService.getTopMenuItems(50);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectItem(item: MenuItem): Promise<void> {
    this.selectedItem = item;
    try {
      this.itemPosts = await this.postService.getPostsByMenuItem(item.id);
    } catch (error) {
      console.error('Error loading item posts:', error);
    }
  }

  get filteredItems(): MenuItem[] {
    if (!this.searchQuery) {
      return this.menuItems;
    }
    return this.menuItems.filter(item =>
      item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  clearSelection(): void {
    this.selectedItem = null;
    this.itemPosts = [];
  }
}