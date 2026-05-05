import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GoogleAuthButtonComponent } from '../components/google-auth-button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, GoogleAuthButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth-page">
      <div class="ambient-shape ambient-shape-left" aria-hidden="true"></div>
      <div class="ambient-shape ambient-shape-right" aria-hidden="true"></div>
      <div class="brand-watermark" aria-hidden="true">Cyphvv</div>

      <div class="auth-card">
        <h1>Entrar</h1>
        <p class="subtitle">
          Acesse seu universo e continue construindo mundos, faccoes e lore.
        </p>

        <app-google-auth-button
          label="Continuar com Google"
          (pressed)="loginWithGoogle()"
        />

        <p class="helper-text">
          Nao tem conta?
          <a routerLink="/registro">Criar conta com Google</a>
        </p>
      </div>
    </section>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
      position: relative;
      overflow: hidden;
      background-image:
        linear-gradient(to bottom, rgba(20, 25, 35, 0.6) 0%, rgba(17, 21, 29, 0.95) 100%),
        url('/home_digital_art.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .ambient-shape {
      position: absolute;
      width: 22rem;
      height: 22rem;
      border-radius: 9999px;
      filter: blur(8px);
      opacity: 0.35;
      pointer-events: none;
    }

    .brand-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: clamp(3.5rem, 16vw, 11rem);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(102, 169, 255, 0.11);
      user-select: none;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }

    .ambient-shape-left {
      top: -8rem;
      left: -6rem;
      background: #416ca8;
    }

    .ambient-shape-right {
      bottom: -9rem;
      right: -6rem;
      background: #b56b35;
    }

    .auth-card {
      width: min(100%, 28rem);
      background: rgba(30, 36, 48, 0.9);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      z-index: 1;
      backdrop-filter: blur(4px);
    }

    h1 {
      margin: 0.5rem 0 0;
      font-size: 2rem;
      color: var(--color-text-primary);
    }

    .subtitle {
      margin: 0.75rem 0 1.5rem;
      color: var(--color-text-secondary);
      line-height: 1.55;
    }

    .helper-text {
      margin: 1.25rem 0 0;
      color: var(--color-text-secondary);
      font-size: 0.95rem;
      text-align: center;
    }

    .helper-text a {
      color: var(--color-brand-blue-strong);
      font-weight: 600;
      text-decoration: none;
    }

    .helper-text a:hover {
      text-decoration: underline;
    }

    .helper-text a:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
      border-radius: 0.25rem;
    }
  `,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async loginWithGoogle(): Promise<void> {
    const isLoggedIn = await this.authService.loginWithGoogle();
    if (isLoggedIn) {
      await this.router.navigateByUrl('/mundos');
    }
  }
}
