import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Firebase Firestore functions
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'] // ✅ Correct
})
export class FeedbackComponent {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);

  feedback = {
    name: '',
    message: ''
  };

  async submitFeedback() {
    try {
      this.ngZone.runOutsideAngular(async () => {
        const feedbackCollection = collection(this.firestore, 'feedbacks');
        await addDoc(feedbackCollection, {
          name: this.feedback.name,
          message: this.feedback.message,
          timestamp: new Date()
        });

        // ✅ Re-enter Angular zone to update UI
        this.ngZone.run(() => {
          alert('Feedback submitted successfully!');
          this.feedback = { name: '', message: '' };
        });
      });
    } catch (error) {
      console.error('Firestore write error:', error);
      alert('Error submitting feedback. Check console for details.');
    }
  }
}