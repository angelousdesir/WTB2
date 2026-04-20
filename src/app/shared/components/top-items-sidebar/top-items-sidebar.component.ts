import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private menuParserService: MenuParserService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.topItems = await this.menuParserService.getTopMenuItems(5);
    } catch (error) {
      console.error('Error loading top items:', error);
    } finally {
      this.loading = false;
    }
  }
}