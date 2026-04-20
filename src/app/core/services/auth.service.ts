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
    const session = await this.supabaseService.getSession();
    if (session) {
      await this.loadUserProfile(session.user.id);
    }

    // Listen to auth state changes
    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this.currentUserSubject.next(data as User);
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, username: string): Promise<void> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabaseService.client.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create user profile
      const { error: profileError } = await this.supabaseService.client
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          username,
          role: 'customer',
          created_at: new Date().toISOString()
        }]);

      if (profileError) throw profileError;

      await this.loadUserProfile(authData.user.id);
      this.router.navigate(['/home']);
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      await this.loadUserProfile(data.user.id);
      this.router.navigate(['/home']);
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
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
   * Check if user is owner
   */
  isOwner(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'owner' || user?.role === 'admin';
  }
}