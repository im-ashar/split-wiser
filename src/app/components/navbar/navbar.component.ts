import {Component, ElementRef, Renderer2} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.component.html',
  standalone: true,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) {}
  toggleNavbar() {
    const mobileNavbar = this.el.nativeElement.querySelector('#navbar-default');
    mobileNavbar.classList.toggle('hidden');
  }
}
