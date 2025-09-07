import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  showSuccess = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required]]
    });
  }

  // Template-driven form submission
  onTemplateSubmit(form: any) {
    if (form.valid) {
      this.isSubmitting = true;
      
      // Get form data
      const formData = new FormData(form.form.nativeElement);
      formData.append('form-name', 'contact-template');

      // Submit to Netlify
      this.http.post('/', formData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess = true;
        },
        error: (error) => {
          console.error('Form submission error:', error);
          this.isSubmitting = false;
          alert('There was an error sending your message. Please try again.');
        }
      });
    }
  }

  // Reactive form submission with AJAX
  onReactiveSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      // Encode form data for Netlify
      const formData = this.encode({
        'form-name': 'contact-reactive',
        ...this.contactForm.value
      });

      this.http.post('/', formData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        responseType: 'text'
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess = true;
          this.contactForm.reset();
        },
        error: (error) => {
          console.error('Form submission error:', error);
          this.isSubmitting = false;
          alert('There was an error sending your message. Please try again.');
        }
      });
    }
  }

  // Helper method to encode form data
  private encode(data: any): string {
    return Object.keys(data)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  }

  resetForm() {
    this.showSuccess = false;
    this.isSubmitting = false;
    this.contactForm.reset();
  }
}


