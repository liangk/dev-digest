export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  author: string;
  description?: string;
  repo?: string;
  body?: string; // Optional since it might not be loaded yet
}