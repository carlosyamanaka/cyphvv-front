import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Loader2 } from 'lucide-angular';
import { WorldsStore } from '../data-access/worlds.store';

@Component({
  selector: 'app-worlds-page',
  imports: [ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="worlds-page">
      <main class="worlds-panel">
        <p class="eyebrow">Seus mundos</p>
        <p class="panel-subtitle">Escolha um mundo para continuar.</p>

        <div class="world-list">
        @if (isLoading()) {
          <article class="world-card empty">
            <div class="empty-content">
                <lucide-icon [img]="Loader2Icon" [size]="40" class="spin-icon" strokeWidth="1.5" color="#c6d2ff"></lucide-icon>
            </div>
          </article>
        } @else {
          @for (world of worlds(); track world.id) {
              <article class="world-card">
              <button
                type="button"
                class="world-button"
                (click)="openWorld(world.id)"
                [attr.aria-label]="'Abrir mundo ' + world.name"
              >
                  <p class="world-date">Atualizado {{ world.createdAtLabel }}</p>
                <h2>{{ world.name }}</h2>
                <p>{{ world.summary }}</p>
              </button>
            </article>
          } @empty {
            <article class="world-card empty">
              <div class="empty-content">
                  <h2>Nenhum mundo ainda</h2>
                  <p>Clique em "Criar novo mundo" para iniciar o primeiro.</p>
              </div>
            </article>
          }
        }
        </div>

        <button type="button" class="create-button create-world-main" (click)="openCreateWorldDialog()">
          Criar novo mundo
        </button>
      </main>

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
              <button type="submit" class="create-button" [disabled]="isCreatingWorld()">
                @if (isCreatingWorld()) {
                  Criando...
                } @else {
                  Salvar mundo
                }
              </button>
            </div>
          </form>
        </section>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .worlds-page {
      position: relative;
      width: 100vw;
      margin-inline: calc(50% - 50vw);
      height: calc(100dvh - 4rem - 1px);
      min-height: calc(100dvh - 4rem - 1px);
      box-sizing: border-box;
      overflow: hidden;
      display: grid;
      place-items: center;
      padding: 1rem clamp(1rem, 3vw, 2rem);
      isolation: isolate;
      background-image: url('/img/city_purple.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .worlds-page::before {
      content: '';
      position: absolute;
      inset: 0;
      background: inherit;
      background-size: cover;
      background-position: center;
      filter: blur(3px) brightness(0.68);
      z-index: -2;
    }

    .worlds-page::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 50% 22%, rgba(112, 101, 193, 0.16) 0%, transparent 58%),
        linear-gradient(to bottom, rgba(6, 8, 20, 0.2), rgba(7, 9, 18, 0.58));
      z-index: -1;
    }

    .worlds-panel {
      width: min(100%, 34rem);
      height: min(100%, 38rem);
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 0.8rem;
      padding: 1rem;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(158, 171, 219, 0.24);
      background: linear-gradient(170deg, rgba(10, 14, 27, 0.62) 0%, rgba(7, 11, 24, 0.84) 100%);
      box-shadow: 0 20px 44px rgba(2, 4, 12, 0.42);
      backdrop-filter: blur(5px);
      box-sizing: border-box;
    }

    .eyebrow {
      margin: 0;
      font-size: 1.2rem;
      text-transform: none;
      letter-spacing: normal;
      font-weight: 700;
      color: #ecf0ff;
    }

    .panel-subtitle {
      margin: 0;
      color: rgba(221, 230, 255, 0.75);
      font-size: 0.85rem;
    }

    .create-button {
      border: 0;
      border-radius: var(--radius-pill);
      background: linear-gradient(135deg, #8f9bed 0%, #7687df 100%);
      color: #111731;
      padding: 0.7rem 1rem;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .create-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 22px rgba(93, 110, 217, 0.4);
    }

    .create-button:disabled {
      background: linear-gradient(135deg, #4b527a 0%, #3e4875 100%);
      color: #8c98ca;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    .create-button:focus-visible {
      outline: 2px solid #c6d2ff;
      outline-offset: 2px;
    }

    .create-world-main {
      margin-top: 0.25rem;
      width: 100%;
    }

    .world-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      gap: 0.65rem;
      min-height: 0;
      align-content: start;
      grid-auto-rows: minmax(0, auto);
      grid-auto-flow: row dense;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 0.35rem;
    }

    .world-card {
      border: 1px solid rgba(145, 158, 212, 0.2);
      border-radius: 0.8rem;
      background: rgba(7, 12, 24, 0.5);
      display: flex;
      overflow: hidden;
      min-width: 0;
    }

    .world-button {
      width: 100%;
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 0;
      border-radius: 0.8rem;
      background: transparent;
      text-align: left;
      padding: 0.8rem;
      gap: 0.12rem;
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
      min-width: 0;
    }

    .world-button:hover {
      background: linear-gradient(140deg, rgba(58, 67, 122, 0.32), rgba(34, 48, 84, 0.22));
      box-shadow: inset 0 0 0 1px rgba(169, 185, 255, 0.3);
    }

    .world-button:focus-visible {
      outline: 2px solid #c6d2ff;
      outline-offset: 2px;
    }

    .world-date {
      margin: 0;
      color: rgba(202, 213, 251, 0.76);
      font-size: 0.72rem;
    }

    .world-button h2 {
      margin: 0.4rem 0 0.3rem;
      color: #edf1ff;
      font-size: 0.98rem;
      line-height: 1.25;
      overflow-wrap: anywhere;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .world-button p {
      margin: 0;
      color: rgba(220, 227, 255, 0.76);
      line-height: 1.35;
      font-size: 0.82rem;
      overflow-wrap: anywhere;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .world-card.empty {
      grid-column: 1 / -1;
      background: rgba(7, 12, 24, 0.44);
      border-style: solid;
      min-height: 6.2rem;
      align-items: center;
      justify-content: center;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1.15rem 0.9rem;
      width: 100%;
    }

    .world-card.empty h2 {
      margin: 0 0 0.35rem;
      font-size: 0.92rem;
      color: #e4eaff;
    }

    .world-card.empty p {
      margin: 0;
      color: rgba(204, 216, 255, 0.75);
      font-size: 0.8rem;
      max-width: 32ch;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 17, 0.55);
      backdrop-filter: blur(3px);
      z-index: 20;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(92vw, 28rem);
      background: linear-gradient(165deg, #121831 0%, #0b1329 100%);
      border: 1px solid rgba(162, 176, 235, 0.22);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 1.2rem;
      z-index: 21;
    }

    .dialog h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #edf1ff;
    }

    .dialog p {
      margin: 0.5rem 0 0;
      color: rgba(221, 231, 255, 0.78);
    }

    form {
      margin-top: 1rem;
      display: grid;
      gap: 0.55rem;
    }

    label {
      font-weight: 600;
      color: #edf1ff;
    }

    input {
      width: 100%;
      border: 1px solid rgba(157, 172, 229, 0.4);
      border-radius: var(--radius-sm);
      padding: 0.7rem 0.8rem;
      font-size: 1rem;
      background: rgba(10, 15, 31, 0.85);
      color: #edf1ff;
    }

    input:focus-visible {
      outline: 2px solid #c6d2ff;
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
      border: 1px solid rgba(157, 172, 229, 0.45);
      border-radius: var(--radius-pill);
      background: rgba(11, 17, 36, 0.9);
      color: #edf1ff;
      padding: 0.75rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
    }

    .secondary-button:hover {
      border-color: #b4c2ff;
    }
  `,
})
export class WorldsPageComponent {
  readonly Loader2Icon = Loader2;
  private readonly worldsStore = inject(WorldsStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly worlds = this.worldsStore.worlds;
  readonly isLoading = this.worldsStore.isLoading;
  readonly isCreateDialogOpen = signal(false);
  readonly isCreatingWorld = signal(false);
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

    this.isCreatingWorld.set(true);
    this.worldsStore.createWorld(worldName).subscribe({
      next: (world) => {
        this.isCreatingWorld.set(false);
        this.closeCreateWorldDialog();
        this.openWorld(world.id);
      },
      error: () => {
        this.isCreatingWorld.set(false);
      }
    });
  }

  openWorld(worldId: number): void {
    void this.router.navigate(['/mundos', worldId]);
  }
}