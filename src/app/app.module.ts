import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Core Services
import { SupabaseService } from './core/services/supabase.service';
import { AuthService } from './core/services/auth.service';
import { PostService } from './core/services/post.service';
import { VenueService } from './core/services/venue.service';
import { MenuParserService } from './core/services/menu-parser.service';

// Guards
import { AuthGuard } from './core/guards/auth.guard';

// Shared Components
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { PostCardComponent } from './shared/components/post-card/post-card.component';
import { RatingStarsComponent } from './shared/components/rating-stars/rating-stars.component';
import { TopItemsSidebarComponent } from './shared/components/top-items-sidebar/top-items-sidebar.component';

// Feature Components - Auth
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Feature Components - Main
import { HomeComponent } from './features/home/home.component';
import { FeedComponent } from './features/feed/feed.component';
import { CreatePostComponent } from './features/create-post/create-post.component';
import { ByFoodItemComponent } from './features/by-food-item/by-food-item.component';
import { ByBarComponent } from './features/by-bar/by-bar.component';
import { ByGenreComponent } from './features/by-genre/by-genre.component';
import { MenuUploadComponent } from './features/menu-upload/menu-upload.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';

@NgModule({
  declarations: [
    AppComponent,
    
    // Shared Components
    NavbarComponent,
    PostCardComponent,
    RatingStarsComponent,
    TopItemsSidebarComponent,
    
    // Auth Components
    LoginComponent,
    RegisterComponent,
    
    // Feature Components
    HomeComponent,
    FeedComponent,
    CreatePostComponent,
    ByFoodItemComponent,
    ByBarComponent,
    ByGenreComponent,
    MenuUploadComponent,
    AboutComponent,
    ContactComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    SupabaseService,
    AuthService,
    PostService,
    VenueService,
    MenuParserService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }