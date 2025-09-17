import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { RouterModule } from '@angular/router';
import { BlogService } from '../services/blog.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, MarkdownModule, RouterModule],
  providers: [BlogService],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss'
})
export class PrivacyPolicyComponent {
  isLoading = true;
  privacyPolicy: string = '';

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.blogService.getPrivacyPolicy().subscribe((policy) => {
      this.privacyPolicy = policy;
      this.isLoading = false;
    });
  }
}