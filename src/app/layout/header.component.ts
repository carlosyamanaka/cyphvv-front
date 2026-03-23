import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="container">
        <nav class="nav">
          <a href="/" class="logo" (click)="onLogoClick($event)">
            <img
              ngSrc="/cyphvv-logo.svg"
              width="36"
              height="36"
              alt=""
              aria-hidden="true"
            />
            <span>Cyphvv</span>
          </a>

          <div class="nav-right">
            @if (authService.isAuthenticated()) {
              <p class="user-pill">{{ authService.userDisplayName() }}</p>
            }

            <ul class="nav-links">
              @if (authService.isAuthenticated()) {
                <li>
                  <a
                    routerLink="/mundos"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: true }"
                  >
                    Mundos
                  </a>
                </li>
                <li>
                  <a routerLink="/conta" routerLinkActive="active">Conta</a>
                </li>
                <li>
                  <button type="button" class="logout-button" (click)="logout()">
                    Sair
                  </button>
                </li>
              } @else {
                <li>
                  <a
                    routerLink="/login"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: true }"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a routerLink="/registro" routerLinkActive="active">Registro</a>
                </li>
              }
            </ul>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .header {
      background: rgba(20, 24, 33, 0.82);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--color-border-soft);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 4rem;
      gap: 1rem;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .user-pill {
      margin: 0;
      border: 1px solid var(--color-border-soft);
      background: linear-gradient(135deg, var(--color-bg-soft-blue) 0%, var(--color-bg-soft-orange) 100%);
      color: var(--color-text-primary);
      padding: 0.35rem 0.7rem;
      border-radius: var(--radius-pill);
      font-size: 0.85rem;
      max-width: 16rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      text-decoration: none;
      color: var(--color-text-primary);
      
      &:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
        border-radius: 0.25rem;
      }
    }
    
    .nav-links {
      display: flex;
      gap: 1rem;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
      
      a {
        text-decoration: none;
        color: var(--color-text-secondary);
        font-weight: 500;
        transition: color 0.2s, background-color 0.2s;
        position: relative;
        padding: 0.4rem 0.65rem;
        border-radius: var(--radius-pill);
        
        &:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-elevated);
        }
        
        &:focus-visible {
          outline: 2px solid var(--color-focus-ring);
          outline-offset: 2px;
          border-radius: 0.25rem;
        }
        
        &.active {
          color: var(--color-brand-blue);
          background: var(--color-bg-soft-blue);
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0.2rem;
            left: 0.65rem;
            right: 0.65rem;
            height: 2px;
            background: linear-gradient(90deg, var(--color-brand-blue) 0%, var(--color-brand-orange) 100%);
          }
        }
      }
    }

    .logout-button {
      border: 1px solid var(--color-border-strong);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      border-radius: var(--radius-pill);
      padding: 0.45rem 0.8rem;
      font: inherit;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .logout-button:hover {
      border-color: var(--color-brand-orange);
      box-shadow: var(--shadow-sm);
    }

    .logout-button:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }
    
    @media (max-width: 768px) {
      .logo {
        font-size: 1.1rem;
      }

      .nav-right {
        gap: 0.5rem;
      }

      .user-pill {
        display: none;
      }

      .nav-links {
        gap: 0.6rem;
        font-size: 0.875rem;
      }

      .logout-button {
        padding: 0.35rem 0.65rem;
      }
    }
  `,
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async onLogoClick(event: MouseEvent): Promise<void> {
    event.preventDefault();

    if (!this.authService.isAuthenticated()) {
      return;
    }

    await this.router.navigateByUrl('/mundos');
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
