import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout';
import { BlogComponent } from './blog/blog.component';
import { AboutComponent } from './about/about';
import { ContactComponent } from './contact/contact';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'blog/:slug', component: BlogComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'privacy-policy', component: PrivacyPolicyComponent },
    ]
  },
];
