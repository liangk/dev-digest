import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/base';
import { switchMap, map } from 'rxjs/operators';
import { MarkdownModule } from 'ngx-markdown';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MarkdownModule, RouterModule],
  providers: [BlogService],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit, OnDestroy {
  post: any = null;
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private blogService: BlogService, 
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private meta: Meta
  ) {}
  
  ngOnDestroy() {
    // Clean up meta tags when component is destroyed
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('rel="canonical"');
    this.meta.removeTag('name="article:published_time"');
    this.meta.removeTag('name="article:tag"');
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    } else {
      this.error = 'No post specified';
      this.isLoading = false;
    }
    
    // Subscribe to route changes in case of direct navigation between posts
    this.route.paramMap.subscribe(params => {
      const newSlug = params.get('slug');
      if (newSlug && newSlug !== this.route.snapshot.paramMap.get('slug')) {
        this.loadPost(newSlug);
      }
    });
  }

  private updateMetaTags(post: BlogPost) {
    const url = `${environment.baseUrl}${this.router.url}`;
    const description = post.excerpt || 'Read this article on Stack Insight';
    const image = post.image ? 
      (post.image.startsWith('http') ? post.image : `${environment.baseUrl}${post.image}`) : 
      `${environment.baseUrl}${environment.defaultImage}`;
    
    // Update meta tags
    this.meta.updateTag({ name: 'description', content: description });
    
    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: `${post.title} | Stack Insight` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    
    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: `${post.title} | Stack Insight` });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    
    // Canonical URL
    this.meta.updateTag({ rel: 'canonical', href: url });
    
    // Article specific meta
    if (post.publishedDate) {
      this.meta.updateTag({ name: 'article:published_time', content: new Date(post.publishedDate).toISOString() });
    }
    if (post.tags) {
      post.tags.forEach(tag => {
        this.meta.addTag({ name: 'article:tag', content: tag });
      });
    }
  }
  
  private loadPost(slug: string) {
    this.isLoading = true;
    this.error = null;
    
    // First get the post metadata to ensure it exists
    this.blogService.getPostMetadata().pipe(
      switchMap((posts: BlogPost[]) => {
        const postMeta = posts.find((p: BlogPost) => p.slug === slug);
        if (postMeta) {
          this.titleService.setTitle(`${postMeta.title} | Stack Insight`);
        } else {
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
        this.updateMetaTags(post);
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
