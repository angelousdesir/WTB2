import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'home', 
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'about', 
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  { 
    path: 'contact', 
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  { 
    path: 'feed', 
    loadComponent: () => import('./features/feed/feed.component').then(m => m.FeedComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'create-post', 
    loadComponent: () => import('./features/create-post/create-post.component').then(m => m.CreatePostComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'by-food-item', 
    loadComponent: () => import('./features/by-food-item/by-food-item.component').then(m => m.ByFoodItemComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'by-bar', 
    loadComponent: () => import('./features/by-bar/by-bar.component').then(m => m.ByBarComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'by-bar/:id', 
    loadComponent: () => import('./features/by-bar/by-bar.component').then(m => m.ByBarComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'by-genre', 
    loadComponent: () => import('./features/by-genre/by-genre.component').then(m => m.ByGenreComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'menu-upload', 
    loadComponent: () => import('./features/menu-upload/menu-upload.component').then(m => m.MenuUploadComponent),
    canActivate: [authGuard]
  },
  { 
  path: 'my-venues', 
  loadComponent: () => import('./features/my-venues/my-venues.component').then(m => m.MyVenuesComponent),
  canActivate: [authGuard]
  },
  // NEW: Add Venue Route
  { 
    path: 'add-venue', 
    loadComponent: () => import('./features/add-venue/add-venue.component').then(m => m.AddVenueComponent),
    canActivate: [authGuard]
  },
  // dashboard
  { 
  path: 'dashboard', 
  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [authGuard]
  },
  { 
  path: 'my-reviews', 
  loadComponent: () => import('./features/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent),
  canActivate: [authGuard]
  },
  { 
  path: 'menu-item/:id', 
  loadComponent: () => import('./features/menu-item-detail/menu-item-detail.component').then(m => m.MenuItemDetailComponent)
  },
  { path: '**', redirectTo: 'home' }
];