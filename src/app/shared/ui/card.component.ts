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
      border-radius: var(--radius-md);
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      transition: box-shadow 0.2s, transform 0.2s;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
        transform: translateY(-2px);
      }
    }
  `,
})
export class CardComponent { }
