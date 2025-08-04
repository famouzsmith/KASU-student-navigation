import { Component } from '@angular/core';
import { RouterModule, Router} from '@angular/router';
import { CommonModule} from '@angular/common';
import { FormsModule} from '@angular/forms';

@Component({
  selector: 'app-welcome',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {

  selectedCampus: string = '';

  currentYear = new Date().getFullYear();

  constructor(private router: Router){}
  
  openFeedback(){
    this.router.navigate(['/feedback']);
  }

}
