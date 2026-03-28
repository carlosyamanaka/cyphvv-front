import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorldsStore } from '../data-access/worlds.store';

@Component({
  selector: 'app-worlds-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="worlds-page">
      <header class="hero">
        <div>
          <p class="eyebrow">Seus Mundos</p>
          <h1>Construa novos universos</h1>
          <p>
            Gerencie seus cenarios, faccoes e historias em um so lugar.
          </p>
        </div>

        <button type="button" class="create-button" (click)="openCreateWorldDialog()">
          Criar mundo
        </button>
      </header>

      <div class="world-grid">
        @for (world of worlds(); track world.id) {
          <article class="world-card">
            <button
              type="button"
              class="world-button"
              (click)="openWorld(world.id)"
              [attr.aria-label]="'Abrir mundo ' + world.name"
            >
              <p class="world-date">Criado em {{ world.createdAtLabel }}</p>
              <h2>{{ world.name }}</h2>
              <p>{{ world.summary }}</p>
            </button>
          </article>
        } @empty {
          <article class="world-card empty">
            <div class="empty-content">
              <div class="empty-icon">🌍</div>
              <h2>Nenhum mundo ainda</h2>
              <p>Clique em "Criar mundo" para iniciar o primeiro.</p>
            </div>
          </article>
        }
      </div>

      @if (isCreateDialogOpen()) {
        <div class="dialog-overlay" (click)="closeCreateWorldDialog()" aria-hidden="true"></div>
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="create-world-title">
          <h2 id="create-world-title">Criar mundo</h2>
          <p>Digite um nome para seu novo mundo.</p>

          <form [formGroup]="createWorldForm" (ngSubmit)="submitCreateWorld()" novalidate>
            <label for="world-name">Nome do mundo</label>
            <input
              id="world-name"
              type="text"
              formControlName="worldName"
              placeholder="Ex.: Aethernia"
              maxlength="40"
            />

            @if (worldNameControl.invalid && worldNameControl.touched) {
              <p class="field-error">Informe um nome com pelo menos 2 caracteres.</p>
            }

            <div class="dialog-actions">
              <button type="button" class="secondary-button" (click)="closeCreateWorldDialog()">
                Cancelar
              </button>
              <button type="submit" class="create-button">Salvar mundo</button>
            </div>
          </form>
        </section>
      }
    </section>
  `,
  styles: `
    .worlds-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1rem 1rem;
    }

    .hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-soft);
      background:
        radial-gradient(circle at 0% 50%, rgba(102, 169, 255, 0.12), transparent 42%),
        radial-gradient(circle at 100% 10%, rgba(255, 159, 91, 0.16), transparent 30%),
        linear-gradient(125deg, #232b39 0%, #2c2530 100%);
      box-shadow: var(--shadow-sm);
    }

    .eyebrow {
      margin: 0;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: var(--color-brand-blue);
    }

    h1 {
      margin: 0.45rem 0 0;
      color: var(--color-text-primary);
      font-size: clamp(1.6rem, 4vw, 2rem);
    }

    .hero p {
      margin: 0.6rem 0 0;
      color: var(--color-text-secondary);
      max-width: 42ch;
      line-height: 1.5;
    }

    .create-button {
      border: 0;
      border-radius: var(--radius-pill);
      background: linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue-strong) 100%);
      color: #fff;
      padding: 0.85rem 1.3rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      white-space: nowrap;
    }

    .create-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .create-button:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }

    .world-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .world-card {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      overflow: hidden;
    }

    .world-button {
      width: 100%;
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      text-align: left;
      padding: 1rem;
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }

    .world-button:hover {
      transform: translateY(-2px);
      background:
        linear-gradient(160deg, #2d3646 0%, #312a24 100%);
      box-shadow: inset 0 0 0 1px rgba(102, 169, 255, 0.24);
    }

    .world-button:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }

    .world-date {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.8rem;
    }

    h2 {
      margin: 0.6rem 0 0.4rem;
      color: var(--color-text-primary);
      font-size: 1.1rem;
    }

    .world-card p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    .world-card.empty {
      background: linear-gradient(135deg, rgba(102, 169, 255, 0.08) 0%, rgba(255, 159, 91, 0.08) 100%);
      border-style: dashed;
      border-color: var(--color-border-soft);
      min-height: 200px;
      align-items: center;
      justify-content: center;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1.5rem;
      width: 100%;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }

    .world-card.empty h2 {
      margin: 0 0 0.6rem;
      font-size: 1.2rem;
      color: var(--color-text-secondary);
    }

    .world-card.empty p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.95rem;
      max-width: 32ch;
    }

    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(7, 10, 16, 0.62);
      backdrop-filter: blur(2px);
      z-index: 20;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(92vw, 28rem);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 1.2rem;
      z-index: 21;
    }

    .dialog h2 {
      margin: 0;
      font-size: 1.3rem;
    }

    .dialog p {
      margin: 0.5rem 0 0;
      color: var(--color-text-secondary);
    }

    form {
      margin-top: 1rem;
      display: grid;
      gap: 0.55rem;
    }

    label {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    input {
      width: 100%;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      padding: 0.7rem 0.8rem;
      font-size: 1rem;
      color: var(--color-text-primary);
    }

    input:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .field-error {
      margin: 0;
      color: var(--color-danger);
      font-size: 0.9rem;
    }

    .dialog-actions {
      display: flex;
      justify-content: end;
      gap: 0.65rem;
      margin-top: 0.55rem;
    }

    .secondary-button {
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-pill);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      padding: 0.75rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
    }

    .secondary-button:hover {
      border-color: var(--color-brand-orange);
    }

    @media (max-width: 760px) {
      .hero {
        flex-direction: column;
        align-items: start;
      }
    }
  `,
})
export class WorldsPageComponent {
  private readonly worldsStore = inject(WorldsStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly worlds = this.worldsStore.worlds;
  readonly isCreateDialogOpen = signal(false);
  readonly createWorldForm = this.formBuilder.nonNullable.group({
    worldName: ['', [Validators.required, Validators.minLength(2)]],
  });

  get worldNameControl() {
    return this.createWorldForm.controls.worldName;
  }

  openCreateWorldDialog(): void {
    this.isCreateDialogOpen.set(true);
  }

  closeCreateWorldDialog(): void {
    this.isCreateDialogOpen.set(false);
    this.createWorldForm.reset({ worldName: '' });
  }

  submitCreateWorld(): void {
    this.createWorldForm.markAllAsTouched();
    if (this.createWorldForm.invalid) {
      return;
    }

    const worldName = this.worldNameControl.value.trim();
    if (!worldName) {
      this.worldNameControl.setErrors({ required: true });
      return;
    }

    this.worldsStore.createWorld(worldName);
    this.closeCreateWorldDialog();
  }

  openWorld(worldId: number): void {
    void this.router.navigate(['/mundos', worldId]);
  }
}