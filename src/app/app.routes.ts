import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout';
import { BlogComponent } from './blog/blog.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'blog/:slug', component: BlogComponent },
      // Add more child routes here as needed
    ]
  },
  // Add more routes here if needed
];
