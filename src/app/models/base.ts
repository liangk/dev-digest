export interface BlogPost {
  // Core content
  title: string;
  slug: string;
  thumbnail: string;
  date: string;
  author: string;
  body: string;
  
  // Content metadata (existing fields)
  description?: string;
  excerpt?: string;
  image?: string;
  repo?: string;
  readTime?: number;
  updatedAt?: string;
  
  // Enhanced SEO properties
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  
  // Social media metadata
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'article' | 'website';
  
  // Twitter card specific
  twitterCard?: 'summary' | 'summary_large_image';
  twitterCreator?: string;
  
  // Article specific
  publishedDate?: string; // ISO 8601 format
  section?: string;      // Main category
  tags?: string[];
  
  // Technical
  wordCount?: number;
  
  // External references
  relatedPosts?: string[]; // Array of slugs
}