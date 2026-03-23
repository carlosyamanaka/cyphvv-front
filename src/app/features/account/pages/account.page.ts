import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="account-page">
      <article class="account-card">
        <p class="eyebrow">Conta</p>
        <h1>{{ authService.userDisplayName() }}</h1>

        @if (authService.currentUser(); as user) {
          <dl class="account-details">
            <div>
              <dt>Email</dt>
              <dd>{{ user.email || 'Nao informado' }}</dd>
            </div>
            <div>
              <dt>UID</dt>
              <dd>{{ user.uid }}</dd>
            </div>
            <div>
              <dt>Provedor</dt>
              <dd>Google</dd>
            </div>
          </dl>
        }
      </article>
    </section>
  `,
  styles: `
    .account-page {
      min-height: calc(100vh - 14rem);
      display: grid;
      place-items: center;
      padding: 1.5rem 1rem;
      background:
        radial-gradient(circle at 8% 8%, rgba(102, 169, 255, 0.14), transparent 35%),
        radial-gradient(circle at 95% 95%, rgba(255, 159, 91, 0.14), transparent 30%);
    }

    .account-card {
      width: min(100%, 36rem);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-soft);
      background: linear-gradient(165deg, #1e2633 0%, #1b212d 100%);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-brand-blue);
    }

    h1 {
      margin: 0.45rem 0 1.2rem;
      color: var(--color-text-primary);
      font-size: clamp(1.45rem, 3.4vw, 2rem);
    }

    .account-details {
      display: grid;
      gap: 0.8rem;
      margin: 0;
    }

    .account-details div {
      display: grid;
      gap: 0.25rem;
      border: 1px solid var(--color-border-soft);
      border-radius: 0.65rem;
      padding: 0.75rem;
      background: linear-gradient(145deg, #222a38 0%, #29231f 100%);
    }

    dt {
      color: var(--color-text-muted);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    dd {
      margin: 0;
      color: var(--color-text-primary);
      word-break: break-word;
    }
  `,
})
export class AccountPageComponent {
  readonly authService = inject(AuthService);
}