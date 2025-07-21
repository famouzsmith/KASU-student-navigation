import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Firebase Firestore functions
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'] // ✅ Correct
})
export class FeedbackComponent {

  // ✅ Use Angular DI (functional style)
  private firestore = inject(Firestore);

  feedback = {
    name: '',
    message: ''
  };

  async submitFeedback() {
    try {
      const feedbackCollection = collection(this.firestore, 'feedbacks');
      await addDoc(feedbackCollection, {
        name: this.feedback.name,
        message: this.feedback.message,
        timestamp: new Date()
      });
      alert('Feedback submitted successfully!');
      this.feedback = { name: '', message: '' };
    } catch (error) {
      console.error('Firestore write error:', error);
      alert('Error submitting feedback. Check console for details.');
    }
  }
}
