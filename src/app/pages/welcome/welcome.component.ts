import { Component } from '@angular/core';
import { RouterModule, Router} from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [RouterModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  currentYear = new Date().getFullYear();

  constructor(private router: Router){}
  
  openFeedback(){
    this.router.navigate(['/feedback']);
  }

}
