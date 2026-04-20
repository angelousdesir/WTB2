import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

// Auth Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Feature Components
import { HomeComponent } from './features/home/home.component';
import { FeedComponent } from './features/feed/feed.component';
import { CreatePostComponent } from './features/create-post/create-post.component';
import { ByFoodItemComponent } from './features/by-food-item/by-food-item.component';
import { ByBarComponent } from './features/by-bar/by-bar.component';
import { ByGenreComponent } from './features/by-genre/by-genre.component';
import { MenuUploadComponent } from './features/menu-upload/menu-upload.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';

const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  
  // Protected routes - require authentication
  { 
    path: 'feed', 
    component: FeedComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'create-post', 
    component: CreatePostComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'by-food-item', 
    component: ByFoodItemComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'by-bar', 
    component: ByBarComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'by-bar/:id', 
    component: ByBarComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'by-genre', 
    component: ByGenreComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'menu-upload', 
    component: MenuUploadComponent,
    canActivate: [AuthGuard]
  },
  
  // Fallback route
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }