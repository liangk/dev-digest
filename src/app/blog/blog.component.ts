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
    const url = post.canonicalUrl || `${environment.baseUrl}${this.router.url}`;
    const description = post.metaDescription || post.description || 'Read this article on Dev Digest';
    const ogTitle = post.ogTitle || post.title;
    const ogDescription = post.ogDescription || description;
    const image = post.ogImage || post.image || post.thumbnail ? 
      `${environment.baseUrl}/images/${post.thumbnail}` : 
      `${environment.baseUrl}${environment.defaultImage}`;
    
    // Basic meta tags
    this.titleService.setTitle(`${post.title} | Dev Digest`);
    this.meta.updateTag({ name: 'description', content: description });
    if (post.keywords && post.keywords.length > 0) {
      this.meta.updateTag({ name: 'keywords', content: post.keywords.join(', ') });
    }
    
    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: post.ogType || 'article' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Dev Digest' });
    
    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: post.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    if (post.twitterCreator) {
      this.meta.updateTag({ name: 'twitter:creator', content: post.twitterCreator });
    }
    
    // Canonical URL
    this.meta.updateTag({ rel: 'canonical', href: url });
    
    // Article specific meta
    if (post.publishedDate) {
      this.meta.updateTag({ property: 'article:published_time', content: post.publishedDate });
    }
    if (post.updatedAt) {
      this.meta.updateTag({ property: 'article:modified_time', content: post.updatedAt });
    }
    if (post.section) {
      this.meta.updateTag({ property: 'article:section', content: post.section });
    }
    if (post.tags && post.tags.length > 0) {
      // Remove existing article:tag meta tags first
      this.meta.removeTag('property="article:tag"');
      post.tags.forEach(tag => {
        this.meta.addTag({ property: 'article:tag', content: tag });
      });
    }
    
    // Author information
    this.meta.updateTag({ property: 'article:author', content: post.author });
    
    // Reading time (for rich snippets)
    if (post.readTime) {
      this.meta.updateTag({ name: 'twitter:label1', content: 'Reading time' });
      this.meta.updateTag({ name: 'twitter:data1', content: `${post.readTime} min read` });
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
