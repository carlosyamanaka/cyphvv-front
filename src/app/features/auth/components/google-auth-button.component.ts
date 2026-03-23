import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-google-auth-button',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="google-button" (click)="pressed.emit()">
      <img
        ngSrc="/google-icon.svg"
        width="20"
        height="20"
        alt=""
        aria-hidden="true"
      />
      <span>{{ label() }}</span>
    </button>
  `,
  styles: `
    .google-button {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      cursor: pointer;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-pill);
      padding: 0.8rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      background:
        linear-gradient(180deg, #232a37 0%, #1f2531 100%);
      color: var(--color-text-primary);
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .google-button:hover {
      border-color: var(--color-brand-orange);
      box-shadow: var(--shadow-sm);
    }

    .google-button:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }
  `,
})
export class GoogleAuthButtonComponent {
  label = input.required<string>();
  pressed = output<void>();
}
