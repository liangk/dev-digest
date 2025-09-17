// src/app/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of, Observable} from 'rxjs';
import frontMatter from 'front-matter';
import { BlogPost } from '../models/base';
@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private http: HttpClient) {}

  getPostMetadata(): Observable<BlogPost[]> {
    // Try to get posts from localStorage first
    // const cachedPosts = localStorage.getItem('blogPosts');
    // if (cachedPosts) {
    //   try {
    //     const parsedPosts = JSON.parse(cachedPosts) as BlogPost[];
    //     return of(parsedPosts);
    //   } catch (e) {
    //     console.error('Error parsing cached posts:', e);
    //     localStorage.removeItem('blogPosts'); // Remove invalid cache
    //   }
    // }

    // If not in cache or invalid, fetch from server
    return this.http.get('/blog/list.json').pipe(
      map((data: any) => {
        const posts = data as BlogPost[];
        // Save to localStorage for next time
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        return posts;
      })
    );
  }

  getPost(slug: string): Observable<BlogPost> {
    // Fetch the markdown file from the public/blog directory
    return this.http
      .get(`/blog/${slug}.md`, { responseType: 'text' })
      .pipe(
        map((data: any) => {
          try {
            // Parse the front matter and the body
            const content: any = frontMatter(data);
            return {
              ...content.attributes, // The metadata (title, date, etc.)
              body: content.body      // The markdown content
            };
          } catch (error) {
            console.error('Error parsing markdown:', error);
            return {
              title: 'Error',
              slug: 'Error',
              date: new Date().toISOString(),
              author: 'System',
              body: 'Error loading post content.'
            };
          }
        }),
        catchError(error => {
          console.error('Error fetching post:', error);
          return of({
            title: 'Post Not Found',
            slug: 'Post-Not-Found',
            thumbnail: 'Post-Not-Found.png',
            date: new Date().toISOString(),
            author: 'System',
            body: 'The requested post could not be found.'
          });
        })
      );
  }
}