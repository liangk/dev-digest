import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutComponent {

}
