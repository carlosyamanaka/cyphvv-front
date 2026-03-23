import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WorldsStore } from '../data-access/worlds.store';

@Component({
    selector: 'app-world-detail-page',
    imports: [ReactiveFormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="vault-page">
      @if (world(); as selectedWorld) {
        <header class="vault-topbar">
          <a class="back-link" routerLink="/mundos">Voltar para mundos</a>
          <p class="vault-pill">Vault ativo</p>
        </header>

        <div class="vault-shell">
          <aside class="vault-sidebar">
            <p class="sidebar-label">Mundo</p>
            <h1>{{ selectedWorld.name }}</h1>
            <p class="sidebar-summary">{{ selectedWorld.summary }}</p>

            <section class="notes-tree" aria-label="Arvore de cards">
              <h2>Cards</h2>
              @for (card of cards(); track card.id) {
                <article class="tree-item">
                  <p class="tree-item-title">{{ card.title }}</p>
                  <p class="tree-item-date">{{ card.createdAtLabel }}</p>
                </article>
              } @empty {
                <p class="tree-empty">Sem cards ainda. Crie o primeiro no editor ao lado.</p>
              }
            </section>
          </aside>

          <main class="vault-editor" aria-label="Editor de card">
            <section class="editor-panel">
              <h2>Novo card</h2>
              <p class="editor-helper">Registre lore, personagem, local ou evento.</p>

              <form [formGroup]="cardForm" (ngSubmit)="submitCard()" novalidate>
                <label for="card-title">Titulo</label>
                <input
                  id="card-title"
                  type="text"
                  formControlName="title"
                  maxlength="80"
                  placeholder="Ex.: A Queda do Reino Antigo"
                />

                @if (titleControl.invalid && titleControl.touched) {
                  <p class="field-error">Informe um titulo com pelo menos 2 caracteres.</p>
                }

                <label for="card-description">Conteudo</label>
                <textarea
                  id="card-description"
                  rows="8"
                  formControlName="description"
                  maxlength="500"
                  placeholder="Descreva esse card de lore, evento, faccao ou local..."
                ></textarea>

                @if (descriptionControl.invalid && descriptionControl.touched) {
                  <p class="field-error">Informe uma descricao com pelo menos 4 caracteres.</p>
                }

                <button type="submit" class="save-button">Salvar card</button>
              </form>
            </section>

            <section class="cards-canvas">
              <h2>Notas salvas</h2>
              <div class="cards-grid">
                @for (card of cards(); track card.id) {
                  <article class="card-note">
                    <p class="card-note-date">{{ card.createdAtLabel }}</p>
                    <h3>{{ card.title }}</h3>
                    <p>{{ card.description }}</p>
                  </article>
                } @empty {
                  <article class="card-note empty">
                    <h3>Nenhum card cadastrado</h3>
                    <p>As notas criadas aparecerao aqui em formato de cards.</p>
                  </article>
                }
              </div>
            </section>
          </main>
        </div>
      } @else {
        <article class="not-found">
          <h1>Mundo nao encontrado</h1>
          <p>Esse mundo pode ter sido removido ou o link esta invalido.</p>
          <a routerLink="/mundos" class="back-home-link">Voltar</a>
        </article>
      }
    </section>
  `,
    styles: `
    .vault-page {
      max-width: 1120px;
      margin: 0 auto;
      padding: 1.25rem 1rem 2rem;
      display: grid;
      gap: 0.9rem;
    }

    .vault-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.8rem;
      border: 1px solid var(--color-border-soft);
      border-radius: 0.8rem;
      background:
        linear-gradient(130deg, #1d2533 0%, #2a2128 100%);
      padding: 0.55rem 0.75rem;
      box-shadow: var(--shadow-sm);
    }

    .back-link,
    .back-home-link {
      color: var(--color-brand-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
    }

    .back-link:hover,
    .back-home-link:hover {
      text-decoration: underline;
    }

    .vault-pill {
      margin: 0;
      color: #ffd8bb;
      background: rgba(255, 159, 91, 0.16);
      border: 1px solid rgba(255, 159, 91, 0.36);
      border-radius: 9999px;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .vault-shell {
      min-height: 70vh;
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid var(--color-border-soft);
      background: linear-gradient(180deg, #161c26 0%, #141922 100%);
      display: grid;
      grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
      box-shadow: var(--shadow-md);
    }

    .vault-sidebar {
      background: linear-gradient(180deg, #1a212d 0%, #171d28 100%);
      border-right: 1px solid var(--color-border-soft);
      padding: 1rem;
      display: grid;
      align-content: start;
      gap: 0.9rem;
    }

    .sidebar-label {
      margin: 0;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .vault-sidebar h1 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: clamp(1.3rem, 3.8vw, 1.8rem);
      line-height: 1.2;
    }

    .sidebar-summary {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.45;
      font-size: 0.94rem;
    }

    .notes-tree {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.8rem;
      background: linear-gradient(160deg, #1f2734 0%, #24202b 100%);
      padding: 0.75rem;
      display: grid;
      gap: 0.5rem;
    }

    .notes-tree h2 {
      margin: 0;
      color: var(--color-brand-blue);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .tree-item {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.6rem;
      background: var(--color-bg-elevated);
      padding: 0.55rem;
    }

    .tree-item-title {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .tree-item-date {
      margin: 0.2rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.75rem;
    }

    .tree-empty {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.86rem;
      line-height: 1.4;
    }

    .vault-editor {
      padding: 1rem;
      display: grid;
      gap: 0.9rem;
      align-content: start;
      background: linear-gradient(180deg, #161d29 0%, #141922 100%);
    }

    .editor-panel,
    .cards-canvas,
    .not-found {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.9rem;
      background: var(--color-bg-surface);
      box-shadow: var(--shadow-sm);
      padding: 1rem;
    }

    .editor-panel h2,
    .cards-canvas h2 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1.1rem;
    }

    .editor-helper {
      margin: 0.35rem 0 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    form {
      margin-top: 0.9rem;
      display: grid;
      gap: 0.6rem;
    }

    label {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.92rem;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid var(--color-border-strong);
      border-radius: 0.55rem;
      background: var(--color-bg-surface);
      padding: 0.7rem 0.8rem;
      font-size: 1rem;
      color: var(--color-text-primary);
      resize: vertical;
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--color-text-muted);
    }

    input:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .save-button {
      margin-top: 0.35rem;
      border: 0;
      border-radius: 0.6rem;
      background: linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue-strong) 100%);
      color: #ffffff;
      padding: 0.72rem 1rem;
      font-weight: 700;
      cursor: pointer;
      justify-self: start;
      transition: transform 0.15s ease, filter 0.15s ease;
    }

    .save-button:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
    }

    .field-error {
      margin: 0;
      color: var(--color-danger);
      font-size: 0.86rem;
    }

    .cards-grid {
      margin-top: 0.85rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 0.65rem;
    }

    .card-note {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.7rem;
      padding: 0.9rem;
      background: linear-gradient(170deg, #242d3b 0%, #302823 100%);
    }

    .card-note-date {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.8rem;
    }

    .card-note h3 {
      margin: 0.45rem 0;
      color: var(--color-text-primary);
      font-size: 1rem;
    }

    .card-note p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    .card-note.empty {
      border-style: dashed;
      background: transparent;
    }

    .not-found h1 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1.5rem;
    }

    .not-found p {
      margin: 0.5rem 0 0.9rem;
      color: var(--color-text-secondary);
    }

    @media (max-width: 940px) {
      .vault-shell {
        grid-template-columns: 1fr;
      }

      .vault-sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--color-border-soft);
      }
    }
  `,
})
export class WorldDetailPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly formBuilder = inject(FormBuilder);
    private readonly worldsStore = inject(WorldsStore);

    private readonly routeWorldId = toSignal(
        this.route.paramMap.pipe(
            map((params) => Number(params.get('id')) || 0)
        ),
        { initialValue: 0 }
    );

    readonly world = computed(() => this.worldsStore.getWorldById(this.routeWorldId()));
    readonly cards = computed(() => this.worldsStore.getCardsByWorldId(this.routeWorldId()));

    readonly cardForm = this.formBuilder.nonNullable.group({
        title: ['', [Validators.required, Validators.minLength(2)]],
        description: ['', [Validators.required, Validators.minLength(4)]],
    });

    get titleControl() {
        return this.cardForm.controls.title;
    }

    get descriptionControl() {
        return this.cardForm.controls.description;
    }

    submitCard(): void {
        this.cardForm.markAllAsTouched();
        if (this.cardForm.invalid || !this.world()) {
            return;
        }

        const title = this.titleControl.value.trim();
        const description = this.descriptionControl.value.trim();
        if (!title || !description) {
            return;
        }

        this.worldsStore.createCard(this.routeWorldId(), title, description);
        this.cardForm.reset({ title: '', description: '' });
    }
}
