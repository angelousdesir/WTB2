import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  //private stripePromise: Promise<Stripe | null>;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    //this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  /**
   * Create a checkout session for owner upgrade
   */
  async createCheckoutSession(priceId: string): Promise<string> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      // Call your Supabase Edge Function or backend API
      const { data, error } = await this.supabaseService.client.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/upgrade-success`,
          cancelUrl: `${window.location.origin}/upgrade-canceled`
        }
      });

      if (error) throw error;

      return data.sessionId;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  /**
   * Redirect to Stripe Checkout
   
  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  }
*/

  /**
   * Get user subscription status
   */
  async getUserSubscription(): Promise<any> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabaseService.client
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  }

  /**
   * Create a portal session for managing subscription
   */
  async createPortalSession(): Promise<string> {
    const user = this.authService.currentUserValue;
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await this.supabaseService.client.functions.invoke('create-portal-session', {
        body: {
          userId: user.id,
          returnUrl: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      return data.url;
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      throw new Error(error.message || 'Failed to create portal session');
    }
  }
}