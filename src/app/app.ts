import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Routes } from '@angular/router';
//import { HomeComponent } from '/features/home/home.component.html';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('food-bar-review-app');
}

export const routes: Routes = [
 // { path: '', component: HomeComponent },  // This is your home page
  { path: '**', redirectTo: '' }  // Catch-all redirect
];
