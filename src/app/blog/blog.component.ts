import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/base';
import { switchMap, map } from 'rxjs/operators';
import { MarkdownPipe } from '../pipes/markdown.pipe';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  providers: [BlogService],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  post: any = null;
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private blogService: BlogService, 
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    } else {
      this.error = 'No post specified';
      this.isLoading = false;
    }
  }

  private loadPost(slug: string) {
    this.isLoading = true;
    this.error = null;
    
    // First get the post metadata to ensure it exists
    this.blogService.getPostMetadata().pipe(
      switchMap((posts: BlogPost[]) => {
        const postMeta = posts.find((p: BlogPost) => p.slug === slug);
        if (!postMeta) {
          throw new Error('Post not found');
        }
        // Then get the full post content
        return this.blogService.getPost(slug).pipe(
          map((postContent: BlogPost) => ({
            ...postMeta,  // Include all metadata
            ...postContent  // Include the content (including body)
          }))
        );
      })
    ).subscribe({
      next: (post) => {
        this.post = post;
        this.isLoading = false;
        console.log('Loaded post with metadata:', this.post);
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.error = error.message === 'Post not found' 
          ? 'The requested post could not be found.'
          : 'Failed to load post. Please try again later.';
        this.isLoading = false;
      }
    });
  }
}
