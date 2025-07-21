import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CommonModule} from '@angular/common';
import { ArMapComponent} from './components/ar-map/ar-map.component';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import {NavigationComponent} from './pages/navigation/navigation.component'


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Student-Navigation';
  private auth = inject(Auth);

  construtor(){
    console.log('✅ Firebase Auth instance:', this.auth);
  }
}
