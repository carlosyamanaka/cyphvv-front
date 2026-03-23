import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container">
        <p class="copyright">
          &copy; 2026 Cyphvv. Continue criando seu universo.
        </p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      background:
        linear-gradient(120deg, #171c27 0%, #1f2b40 60%, #31251d 100%);
      color: var(--color-text-secondary);
      padding: 1.7rem 1rem;
      margin-top: 4rem;
      border-top: 1px solid var(--color-border-soft);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .copyright {
      margin: 0;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `,
})
export class FooterComponent { }
