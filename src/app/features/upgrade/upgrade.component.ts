import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StripeService } from '../../core/services/stripe.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.scss']
})
export class UpgradeComponent implements OnInit {
  loading = false;
  hasActiveSubscription = false;
  subscription: any = null;

  // Your Stripe Price IDs (get from Stripe Dashboard)
  plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 9.99,
      priceId: 'price_YOUR_MONTHLY_PRICE_ID',
      interval: 'month',
      features: [
        'Add unlimited venues',
        'Upload menus with OCR',
        'Manage all menu items',
        'Respond to reviews',
        'Analytics dashboard',
        'Priority support'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 99.99,
      priceId: 'price_YOUR_YEARLY_PRICE_ID',
      interval: 'year',
      badge: 'Save 17%',
      features: [
        'All Monthly features',
        'Save $20 per year',
        'Priority feature requests',
        'Dedicated account manager',
        'Advanced analytics',
        'API access'
      ]
    }
  ];

  constructor(
    private stripeService: StripeService,
    public authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.checkSubscriptionStatus();
  }

  async checkSubscriptionStatus(): Promise<void> {
    try {
      this.subscription = await this.stripeService.getUserSubscription();
      this.hasActiveSubscription = !!this.subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }
/*
  async upgradeToPlan(plan: any): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    try {
      const sessionId = await this.stripeService.createCheckoutSession(plan.priceId);
      await this.stripeService.redirectToCheckout(sessionId);
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to start upgrade process. Please try again.');
    } finally {
      this.loading = false;
    }
  }
*/
  async manageSubscription(): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    try {
      const portalUrl = await this.stripeService.createPortalSession();
      window.location.href = portalUrl;
    } catch (error: any) {
      console.error('Portal error:', error);
      alert(error.message || 'Failed to open subscription management. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}