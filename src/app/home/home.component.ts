import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/base';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [BlogService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  posts: BlogPost[] = [];
  constructor(private blogService: BlogService) {
    this.blogService.getPostMetadata().subscribe((posts: BlogPost[]) => {
      this.posts = posts;
    });
  }

  ngOnInit() {
  }
  gotoRepo(event: any, repo: string) {
    event.preventDefault();
    event.stopPropagation();
    window.open(repo, '_blank')
  }
}
