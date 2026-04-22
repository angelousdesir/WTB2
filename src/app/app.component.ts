import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <!-- Debug text -->
      <div style="position: fixed; bottom: 10px; right: 10px; background: red; color: white; padding: 10px;">
        App is loading!
      </div>
    </div>



    <!--<div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>-->
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'FoodBar Reviews';
}