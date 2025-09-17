export interface BlogPost {
  // Core content
  title: string;
  slug: string;
  thumbnail: string;
  date: string;
  publishedDate?: string; // ISO date string
  author: string;
  description?: string;
  excerpt?: string;      // Short summary for meta descriptions
  body?: string;         // Full post content in markdown
  
  // SEO & Metadata
  tags?: string[];       // For article:tag meta tags
  image?: string;        // URL to featured image for social sharing
  
  // Optional
  repo?: string;         // Link to source code
  readTime?: number;     // Estimated reading time in minutes
  updatedAt?: string;    // ISO date string for last update
}