import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterOutlet,
    HeaderComponent
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {}
