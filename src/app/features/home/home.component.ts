import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from '../../shared/header/header.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterOutlet,
    HeaderComponent
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {

}
