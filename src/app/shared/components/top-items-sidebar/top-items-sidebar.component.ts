import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuParserService } from '../../../core/services/menu-parser.service';
import { MenuItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-top-items-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-items-sidebar.component.html',
  styleUrls: ['./top-items-sidebar.component.scss']
})
export class TopItemsSidebarComponent implements OnInit {
  topItems: MenuItem[] = [];
  loading = true;

  constructor(
    private menuParserService: MenuParserService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTopItems();
  }

  async loadTopItems(): Promise<void> {
    this.loading = true;
    try {
      this.topItems = await this.menuParserService.getTopMenuItems(5);
    } catch (error) {
      console.error('Error loading top items:', error);
    } finally {
      this.loading = false;
    }
  }

  navigateToMenuItem(itemId: string): void {
    this.router.navigate(['/menu-item', itemId]);
  }
}