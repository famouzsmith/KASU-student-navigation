import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router'; // ✅ import Router for navigation

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);
  private router = inject(Router); // ✅ inject Router

  feedback = {
    name: '',
    message: ''
  };

  submitted = false; // ✅ Track submission status

  async submitFeedback() {
    try {
      this.ngZone.runOutsideAngular(async () => {
        const feedbackCollection = collection(this.firestore, 'feedbacks');
        await addDoc(feedbackCollection, {
          name: this.feedback.name,
          message: this.feedback.message,
          timestamp: new Date()
        });

        this.ngZone.run(() => {
          this.submitted = true; // ✅ Trigger success UI
          this.feedback = { name: '', message: '' };
        });
      });
    } catch (error) {
      console.error('Firestore write error:', error);
      alert('Error submitting feedback. Check console for details.');
    }
  }

  goBack() {
    this.router.navigate(['/welcome']); // ✅ navigate to welcome page
  }
}
