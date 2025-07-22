import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { ArViewComponent } from './pages/ar-view/ar-view.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'navigation', component: NavigationComponent },
  {
    path: 'navigation',
    loadComponent: () =>
      import('./pages/navigation/navigation.component').then(
        (m) => m.NavigationComponent
      ),
  },
  { path: 'ar-view', component: ArViewComponent }, //  AR View route
  {
    path: 'feedback',
    loadComponent: () => import('./pages/feedback/feedback.component').then(m => m.FeedbackComponent)
  }
];
