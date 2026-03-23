import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
  styles: `
    :host {
      display: block;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s, transform 0.2s;
      
      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
    }
  `,
})
export class CardComponent { }
