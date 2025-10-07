import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  private readonly router = inject(Router);

  onLogin() {
    this.router.navigate(['/home']);
  }
}
