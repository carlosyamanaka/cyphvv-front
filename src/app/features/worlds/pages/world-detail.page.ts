import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WorldsStore } from '../data-access/worlds.store';
import { WorldCard } from '../models/world-card.model';

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
              <section class="sidebar-world">
                <p class="sidebar-label">Mundo</p>
                <h1>{{ selectedWorld.name }}</h1>
                <p class="sidebar-summary">{{ selectedWorld.summary }}</p>
              </section>

              <section class="sidebar-create" aria-label="Criacao de card">
                <h2>Novo card</h2>
                <form [formGroup]="cardForm" (ngSubmit)="submitCard()" novalidate>
                  <label for="card-title">Titulo</label>
                  <input
                    id="card-title"
                    type="text"
                    formControlName="title"
                    maxlength="80"
                    placeholder="Ex.: Ruinas de Ylvor"
                  />

                  @if (titleControl.invalid && titleControl.touched) {
                    <p class="field-error">Informe um titulo com pelo menos 2 caracteres.</p>
                  }

                  <label for="card-description">Conteudo</label>
                  <textarea
                    id="card-description"
                    rows="4"
                    formControlName="description"
                    maxlength="500"
                    placeholder="Escreva o conteudo principal dessa nota."
                  ></textarea>

                  @if (descriptionControl.invalid && descriptionControl.touched) {
                    <p class="field-error">Informe uma descricao com pelo menos 4 caracteres.</p>
                  }

                  <button type="submit" class="save-button">Criar card</button>
                </form>
              </section>

              <section class="notes-tree" aria-label="Lista de cards">
                <div class="tree-head">
                  <h2>Cards</h2>
                  <span>{{ filteredCards().length }}</span>
                </div>

                <label class="search-label" for="card-search">Pesquisar</label>
                <input
                  id="card-search"
                  type="search"
                  class="search-input"
                  placeholder="Buscar por titulo ou conteudo"
                  [value]="searchTerm()"
                  (input)="onSearchInput($event)"
                />

                <div class="tree-list">
                  @for (card of filteredCards(); track card.id) {
                    <button
                      type="button"
                      class="tree-item"
                      [class.is-active]="activeCardId() === card.id"
                      (click)="openCard(card.id)"
                      [attr.aria-label]="'Abrir card ' + card.title"
                    >
                      <p class="tree-item-title">{{ card.title }}</p>
                      <p class="tree-item-date">{{ card.createdAtLabel }}</p>
                    </button>
                  } @empty {
                    <p class="tree-empty">Nenhum card encontrado para esse filtro.</p>
                  }
                </div>
              </section>
          </aside>

            <main class="vault-editor" aria-label="Notas abertas">
              <section class="open-notes-shell">
                <div class="open-notes-header">
                  <h2>Notas abertas</h2>
                  <p>Fluxo tipo Obsidian: abra cards na lateral e trabalhe no centro.</p>
                </div>

                @if (openCards().length) {
                  <div class="tab-strip" role="tablist" aria-label="Abas de notas abertas">
                    @for (card of openCards(); track card.id) {
                      <div class="tab-item" [class.is-active]="activeCardId() === card.id">
                        <button
                          type="button"
                          class="tab-button"
                          role="tab"
                          [attr.aria-selected]="activeCardId() === card.id"
                          (click)="openCard(card.id)"
                        >
                          {{ card.title }}
                        </button>
                        <button
                          type="button"
                          class="tab-close"
                          (click)="closeCard(card.id)"
                          [attr.aria-label]="'Fechar nota ' + card.title"
                        >
                          x
                        </button>
                      </div>
                    }
                  </div>

                  @if (activeCard(); as selectedCard) {
                    <article class="note-panel" role="tabpanel">
                      <header>
                        <p class="note-meta">Atualizado em {{ selectedCard.createdAtLabel }}</p>
                        <h3>{{ selectedCard.title }}</h3>
                      </header>
                      <p>{{ selectedCard.description }}</p>
                    </article>
                  }
                } @else {
                  <article class="empty-state">
                    <h3>Nenhuma nota aberta</h3>
                    <p>Abra um card pela barra da esquerda para visualizar no centro.</p>
                  </article>
                }
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
      grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
      box-shadow: var(--shadow-md);
    }

    .vault-sidebar {
      background: linear-gradient(180deg, #1a212d 0%, #171d28 100%);
      border-right: 1px solid var(--color-border-soft);
      padding: 1rem;
      display: grid;
      align-content: start;
      gap: 0.9rem;
      max-height: calc(100vh - 11.5rem);
      overflow: auto;
    }

    .sidebar-world,
    .sidebar-create,
    .notes-tree,
    .open-notes-shell,
    .not-found {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.9rem;
      background: var(--color-bg-surface);
      box-shadow: var(--shadow-sm);
      padding: 0.9rem;
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

    .sidebar-create {
      display: grid;
      gap: 0.45rem;
    }

    .sidebar-create h2,
    .notes-tree h2,
    .open-notes-header h2 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1rem;
    }

    .sidebar-create form {
      margin-top: 0.4rem;
      display: grid;
      gap: 0.45rem;
    }

    .notes-tree {
      display: grid;
      gap: 0.55rem;
      background: linear-gradient(160deg, #1f2734 0%, #24202b 100%);
      min-height: 17rem;
    }

    .tree-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .tree-head span {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid var(--color-border-soft);
      border-radius: 9999px;
      padding: 0.1rem 0.5rem;
    }

    .search-label {
      color: var(--color-text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .search-input {
      width: 100%;
      border: 1px solid var(--color-border-strong);
      border-radius: 0.5rem;
      background: var(--color-bg-surface);
      padding: 0.55rem 0.7rem;
      color: var(--color-text-primary);
    }

    .search-input:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .tree-list {
      display: grid;
      gap: 0.45rem;
      max-height: 19rem;
      overflow: auto;
    }

    .tree-item {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.6rem;
      background: var(--color-bg-elevated);
      padding: 0.55rem;
      text-align: left;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }

    .tree-item:hover {
      transform: translateY(-1px);
      border-color: rgba(102, 169, 255, 0.35);
    }

    .tree-item.is-active {
      border-color: var(--color-brand-blue);
      box-shadow: inset 0 0 0 1px rgba(102, 169, 255, 0.28);
    }

    .tree-item:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
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
      max-height: calc(100vh - 11.5rem);
      overflow: auto;
    }

    .open-notes-shell {
      min-height: 100%;
      display: grid;
      align-content: start;
      gap: 0.75rem;
    }

    .open-notes-header p {
      margin: 0.4rem 0 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .tab-strip {
      display: flex;
      gap: 0.45rem;
      overflow: auto;
      padding-bottom: 0.2rem;
    }

    .tab-item {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--color-border-soft);
      background: #1c2533;
      border-radius: 0.6rem;
      overflow: hidden;
    }

    .tab-item.is-active {
      border-color: var(--color-brand-blue);
      box-shadow: inset 0 0 0 1px rgba(102, 169, 255, 0.28);
      background: #212c3b;
    }

    .tab-button {
      border: 0;
      background: transparent;
      color: var(--color-text-primary);
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab-button:focus-visible,
    .tab-close:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: -2px;
    }

    .tab-close {
      border: 0;
      border-left: 1px solid var(--color-border-soft);
      background: transparent;
      color: var(--color-text-muted);
      width: 2rem;
      cursor: pointer;
      font-size: 0.82rem;
    }

    .tab-close:hover {
      color: var(--color-text-primary);
      background: rgba(255, 255, 255, 0.06);
    }

    .note-panel,
    .empty-state {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.8rem;
      background: linear-gradient(180deg, #1f2735 0%, #1b2230 100%);
      padding: 1rem;
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

    .note-meta {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.8rem;
    }

    .note-panel h3,
    .empty-state h3 {
      margin: 0.45rem 0;
      color: var(--color-text-primary);
      font-size: 1.2rem;
    }

    .note-panel p,
    .empty-state p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.6;
      white-space: pre-wrap;
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
        max-height: none;
        overflow: visible;
      }

      .vault-editor {
        max-height: none;
        overflow: visible;
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
  readonly searchTerm = signal('');
  readonly openCardIds = signal<number[]>([]);
  readonly activeCardId = signal<number | null>(null);

  readonly filteredCards = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const allCards = this.cards();
    if (!query) {
      return allCards;
    }

    return allCards.filter((card) =>
      card.title.toLowerCase().includes(query)
      || card.description.toLowerCase().includes(query)
    );
  });

  readonly openCards = computed(() => {
    const cardsById = new Map(this.cards().map((card) => [card.id, card]));
    return this.openCardIds()
      .map((id) => cardsById.get(id))
      .filter((card): card is WorldCard => card !== undefined);
  });

  readonly activeCard = computed(() =>
    this.openCards().find((card) => card.id === this.activeCardId()) ?? null
  );

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

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  openCard(cardId: number): void {
    this.openCardIds.update((currentIds) =>
      currentIds.includes(cardId) ? currentIds : [...currentIds, cardId]
    );
    this.activeCardId.set(cardId);
  }

  closeCard(cardId: number): void {
    const currentIds = this.openCardIds();
    const closedIndex = currentIds.indexOf(cardId);
    if (closedIndex === -1) {
      return;
    }

    const nextIds = currentIds.filter((id) => id !== cardId);
    this.openCardIds.set(nextIds);

    if (this.activeCardId() !== cardId) {
      return;
    }

    if (!nextIds.length) {
      this.activeCardId.set(null);
      return;
    }

    const fallbackIndex = Math.min(closedIndex, nextIds.length - 1);
    this.activeCardId.set(nextIds[fallbackIndex]);
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

    this.worldsStore.createCard(this.routeWorldId(), title, description).subscribe({
      next: (createdCard) => {
        this.cardForm.reset({ title: '', description: '' });
        this.searchTerm.set('');
        this.openCard(createdCard.id);
      },
      error: () => {
        // Error handling is already managed by the store
      },
    });
  }
}
