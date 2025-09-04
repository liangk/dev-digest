import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: any): SafeHtml {
    if (!value) return '';
    
    try {
      // Convert markdown to HTML
      const html = marked(value.body);
      if (typeof html !== 'string') {
        return '';
      }
      // Sanitize HTML to prevent XSS
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (e) {
      console.error('Error parsing markdown:', e);
      return '';
    }
  }
}
