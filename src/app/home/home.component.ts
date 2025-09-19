import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/base';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [BlogService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  posts: BlogPost[] = [];

  constructor(private blogService: BlogService, private router: Router) {
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

  navigateToPost(slug: string): void {
    this.router.navigate(['/blog', slug]);
  }
}
