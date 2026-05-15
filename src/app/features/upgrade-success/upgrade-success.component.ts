import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upgrade-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upgrade-success.component.html',
  styleUrls: ['./upgrade-success.component.scss']
})
export class UpgradeSuccessComponent implements OnInit {
  countdown = 5;
  private countdownInterval: any;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Reload user profile to get updated role
    //this.reloadUserProfile();
    
    // Start countdown
    this.startCountdown();
  }
/*
  async reloadUserProfile(): Promise<void> {
    const user = this.authService.currentUserValue;
    if (user) {
      try {
        await this.authService.loadUserProfile(user.id);
      } catch (error) {
        console.error('Error reloading profile:', error);
      }
    }
  }
*/
  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.navigateToDashboard();
      }
    }, 1000);
  }

  navigateToDashboard(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}