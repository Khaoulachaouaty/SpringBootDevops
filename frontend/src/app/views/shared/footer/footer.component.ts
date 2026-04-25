import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-light border-top mt-auto py-4">
      <div class="container text-center text-muted">
        <small>&copy; 2024 Clinique Médicale - Tous droits réservés</small>
      </div>
    </footer>
  `,
  styles: [`:host { display: block; }`]
})
export class FooterComponent {}