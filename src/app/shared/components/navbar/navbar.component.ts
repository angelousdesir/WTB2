import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  showMobileMenu = false;
  showAccountMenu = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  get currentUser() {
    return this.authService.currentUserValue;
  }

  getUserInitial(): string {
    if (!this.currentUser) return 'U';
    
    const username = this.currentUser.username || this.currentUser.email;
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    if (this.showMobileMenu) {
      this.showAccountMenu = false;
    }
  }

  toggleAccountMenu(): void {
    this.showAccountMenu = !this.showAccountMenu;
    if (this.showAccountMenu) {
      this.showMobileMenu = false;
    }
  }

  closeMenus(): void {
    this.showMobileMenu = false;
    this.showAccountMenu = false;
  }

  isOwner(): boolean {
    return this.currentUser?.role === 'owner' || this.currentUser?.role === 'admin';
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.closeMenus();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if there's an error
      this.closeMenus();
      this.router.navigate(['/home']);
    }
  }
}