import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth() {
    try {
      const { data: { session } } = await this.supabaseService.client.auth.getSession();
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      }

      // Listen to auth state changes
      this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUserSubject.next(null);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string, retries = 3): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user profile doesn't exist yet, retry after a delay
        if (error.code === 'PGRST116' && retries > 0) {
          console.log(`User profile not found, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.loadUserProfile(userId, retries - 1);
        }
        throw error;
      }

      if (data) {
        console.log('Loaded user profile:', data);
        this.currentUserSubject.next(data as User);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  /**
 * Sign up new user
 */
async signUp(email: string, password: string, username: string, role: 'customer' | 'owner' = 'customer'): Promise<void> {
  try {
    console.log('Starting signup for:', email);

    // First check if user already exists in our users table
    const { data: existingUser } = await this.supabaseService.client
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('An account with this email already exists. Please try logging in instead.');
    }

    // Create auth user
    const { data: authData, error: authError } = await this.supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      
      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log('Auth user created:', authData.user.id);

    // Wait for auth to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to create user profile with retry logic
    let profileCreated = false;
    let retries = 3;

    while (!profileCreated && retries > 0) {
      try {
        const { data: profileData, error: profileError } = await this.supabaseService.client
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            username,
            role: role,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (profileError) {
          // Check if profile already exists
          if (profileError.code === '23505') { // Unique violation
            console.log('Profile already exists, fetching it...');
            const { data: existingProfile } = await this.supabaseService.client
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (existingProfile) {
              this.currentUserSubject.next(existingProfile as User);
              profileCreated = true;
              break;
            }
          }
          throw profileError;
        }

        console.log('User profile created:', profileData);
        this.currentUserSubject.next(profileData as User);
        profileCreated = true;
      } catch (error) {
        console.error(`Profile creation attempt failed (${retries} retries left):`, error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }

    if (!profileCreated) {
      throw new Error('Failed to create user profile after multiple attempts');
    }

    // Check if email confirmation is required
    if (authData.session) {
      console.log('User signed in automatically');
      this.router.navigate(['/dashboard']);
    } else {
      alert('Account created! Please check your email to confirm your account.');
      this.router.navigate(['/login']);
    }
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Sign up failed');
  }
}

 /**
 * Sign in existing user
 */
async signIn(email: string, password: string): Promise<void> {
  try {
    console.log('Attempting sign in for:', email);

    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
      }
      
      throw error;
    }

    if (!data.user) {
      throw new Error('Sign in failed - no user data');
    }

    console.log('Sign in successful:', data.user.id);

    // Load user profile with retry
    await this.loadUserProfile(data.user.id, 3);

    // Verify profile was loaded
    if (!this.currentUserValue) {
      throw new Error('Failed to load user profile. Please contact support.');
    }

    this.router.navigate(['/dashboard']);
  } catch (error: any) {
    console.error('Sign in failed:', error);
    throw new Error(error.message || 'Sign in failed. Please try again.');
  }
}

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await this.supabaseService.client.auth.signOut();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(newRole: 'customer' | 'owner' | 'admin'): Promise<void> {
    const user = this.currentUserValue;
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      console.log(`Updating user role from ${user.role} to ${newRole}`);

      const { data, error } = await this.supabaseService.client
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }

      // Update current user state
      this.currentUserSubject.next(data as User);
      console.log('User role updated successfully:', data);
      
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error updating role:', error);
      throw new Error(error.message || 'Failed to update role');
    }
  }

  /**
   * Refresh user profile from database
   */
  async refreshUserProfile(): Promise<void> {
    const user = this.currentUserValue;
    if (user) {
      await this.loadUserProfile(user.id, 1);
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Check if user is owner or admin
   */
  isOwner(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'owner' || user?.role === 'admin';
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'admin';
  }

  /**
   * Check if user is customer
   */
  isCustomer(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'customer';
  }
}