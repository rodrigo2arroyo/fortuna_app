import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="flex flex-col min-h-screen">
      <header class="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Mi App</h1>
        <nav class="flex gap-4">
          <a routerLink="/" class="hover:underline">Home</a>
          <a routerLink="/auth/login" class="hover:underline">Login</a>
        </nav>
      </header>
      <main class="flex-1 p-6 bg-gray-50">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class LayoutComponent {}
