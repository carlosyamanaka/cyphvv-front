import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [attr.type]="type()"
      [attr.disabled]="disabled()"
      [class]="buttonClasses()"
      (click)="onClick.emit()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: `
    button {
      cursor: pointer;
      font-weight: 600;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
      border: none;
      font-family: inherit;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue-strong) 100%);
      color: white;
      
      &:hover:not(:disabled) {
        filter: brightness(1.05);
        box-shadow: var(--shadow-sm);
      }
    }
    
    .btn-secondary {
      background-color: var(--color-bg-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      
      &:hover:not(:disabled) {
        border-color: var(--color-brand-orange);
      }
    }
    
    .btn-ghost {
      background-color: transparent;
      color: var(--color-brand-blue);
      border: 1px solid var(--color-brand-blue);
      
      &:hover:not(:disabled) {
        background-color: var(--color-bg-soft-blue);
      }
    }
    
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .btn-md {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
    
    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
  `,
})
export class ButtonComponent {
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);

  onClick = output<void>();

  buttonClasses(): string {
    const variant = `btn-${this.variant()}`;
    const size = `btn-${this.size()}`;
    return `${variant} ${size}`;
  }
}
