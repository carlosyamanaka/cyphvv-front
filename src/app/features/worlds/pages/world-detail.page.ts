import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WorldsStore } from '../data-access/worlds.store';
import { WorldCard } from '../models/world-card.model';

interface CardPropertyDraft {
  key: string;
  value: string;
}

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
                <form [formGroup]="cardForm" novalidate>
                  <label for="card-type">Tipo do card</label>
                  <select
                    id="card-type"
                    formControlName="cardTypeId"
                    [disabled]="isLoadingCardTypes() || isCreatingCardFromType()"
                    (change)="createCardFromSelectedType()"
                  >
                    <option [ngValue]="null">Selecione um tipo</option>
                    @for (type of cardTypes(); track type.id) {
                      <option [ngValue]="type.id">{{ type.cardTypeName }}</option>
                    }
                  </select>

                  @if (isLoadingCardTypes()) {
                    <p class="field-hint">Carregando tipos de card...</p>
                  }

                  @if (isCreatingCardFromType()) {
                    <p class="field-hint">Criando card padrao...</p>
                  }

                  <p class="field-hint">Ao selecionar o tipo, o card e criado automaticamente e aberto no visualizador com conteudo padrao.</p>
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
                      [class.is-active]="isVisibleCard(card.id)"
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
                </div>

                @if (openCards().length) {
                  <section
                    class="note-panels"
                    [class.note-panels-single]="visibleCards().length === 1"
                    aria-label="Visualizacao simultanea de cards"
                  >
                    @for (selectedCard of visibleCards(); track selectedCard.id) {
                      <article class="note-panel" role="tabpanel">
                        <header class="note-header">
                          <div class="note-header-top">
                            <div class="note-header-meta">
                              <p class="note-meta">Atualizado em {{ selectedCard.createdAtLabel }}</p>
                              <p class="note-type">Tipo: {{ getCardTypeLabel(selectedCard) }}</p>
                            </div>
                            <button
                              type="button"
                              class="panel-close"
                              (click)="closeCard(selectedCard.id)"
                              [attr.aria-label]="'Fechar nota ' + selectedCard.title"
                            >
                              x
                            </button>
                          </div>

                          <label [attr.for]="'card-name-' + selectedCard.id">Nome do card</label>
                          <input
                            [id]="'card-name-' + selectedCard.id"
                            type="text"
                            class="note-title-input"
                            maxlength="80"
                            [value]="getTitleDraft(selectedCard)"
                            (input)="onTitleDraftInput(selectedCard.id, $event)"
                            (blur)="commitTitle(selectedCard)"
                          />
                        </header>

                        <section class="note-section">
                          <h4>Aliases</h4>
                          <div class="inline-form">
                            <input
                              [id]="'card-alias-' + selectedCard.id"
                              type="text"
                              placeholder="Adicionar alias"
                              [value]="getAliasInput(selectedCard.id)"
                              (input)="onAliasInput(selectedCard.id, $event)"
                            />
                            <button type="button" class="save-button" (click)="addAlias(selectedCard.id)">Adicionar alias</button>
                          </div>

                          @if (getCardAliases(selectedCard.id).length) {
                            <div class="alias-list">
                              @for (alias of getCardAliases(selectedCard.id); track alias) {
                                <button
                                  type="button"
                                  class="alias-chip"
                                  [attr.aria-label]="'Remover alias ' + alias"
                                  (click)="removeAlias(selectedCard.id, alias)"
                                >
                                  {{ alias }} x
                                </button>
                              }
                            </div>
                          } @else {
                            <p class="field-hint">Sem aliases adicionados.</p>
                          }
                        </section>

                        <section class="note-section">
                          <div class="section-head">
                            <h4>Propriedades</h4>
                            <button type="button" class="secondary-action" (click)="addProperty(selectedCard.id)">Adicionar propriedade</button>
                          </div>

                          @if (getCardProperties(selectedCard.id).length) {
                            <div class="property-list">
                              @for (property of getCardProperties(selectedCard.id); track $index) {
                                <div class="property-row">
                                  <input
                                    type="text"
                                    placeholder="Nome"
                                    [value]="property.key"
                                    (input)="onPropertyKeyInput(selectedCard.id, $index, $event)"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Valor"
                                    [value]="property.value"
                                    (input)="onPropertyValueInput(selectedCard.id, $index, $event)"
                                  />
                                  <button
                                    type="button"
                                    class="icon-action"
                                    aria-label="Remover propriedade"
                                    (click)="removeProperty(selectedCard.id, $index)"
                                  >
                                    x
                                  </button>
                                </div>
                              }
                            </div>
                          } @else {
                            <p class="field-hint">Nenhuma propriedade criada ainda.</p>
                          }
                        </section>

                        <section class="note-section">
                          <h4>Conteudo</h4>
                          <p>{{ selectedCard.description }}</p>
                        </section>
                      </article>
                    }
                  </section>
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

    .note-panel,
    .empty-state {
      border: 1px solid var(--color-border-soft);
      border-radius: 0.8rem;
      background: linear-gradient(180deg, #1f2735 0%, #1b2230 100%);
      padding: 1rem;
    }

    .note-panels {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .note-panels.note-panels-single {
      grid-template-columns: minmax(0, 1fr);
    }

    label {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.92rem;
    }

    input,
    select,
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
    select:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .field-hint {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      line-height: 1.4;
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

    .note-header {
      display: grid;
      gap: 0.45rem;
      margin-bottom: 0.85rem;
    }

    .note-header-top {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .note-header-meta {
      display: grid;
      gap: 0.35rem;
    }

    .note-type {
      color: #ffd8bb;
      background: rgba(255, 159, 91, 0.16);
      border: 1px solid rgba(255, 159, 91, 0.36);
      border-radius: 9999px;
      padding: 0.2rem 0.6rem;
      font-size: 0.78rem;
      font-weight: 700;
      justify-self: start;
    }

    .panel-close {
      border: 1px solid var(--color-border-strong);
      border-radius: 0.55rem;
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      min-width: 2.2rem;
      min-height: 2.2rem;
      display: inline-grid;
      place-items: center;
      font-size: 1rem;
      line-height: 1;
      font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
    }

    .panel-close:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .panel-close:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .note-title-input {
      font-weight: 700;
    }

    .note-section {
      border-top: 1px solid var(--color-border-soft);
      padding-top: 0.85rem;
      margin-top: 0.85rem;
      display: grid;
      gap: 0.55rem;
    }

    .note-section h4 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 0.92rem;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .inline-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.55rem;
      align-items: center;
    }

    .alias-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .alias-chip,
    .secondary-action,
    .icon-action {
      border: 1px solid var(--color-border-strong);
      border-radius: 0.55rem;
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      cursor: pointer;
      font-weight: 600;
    }

    .alias-chip {
      padding: 0.35rem 0.6rem;
      font-size: 0.82rem;
    }

    .secondary-action {
      padding: 0.45rem 0.65rem;
      font-size: 0.82rem;
      white-space: nowrap;
    }

    .icon-action {
      width: 2.1rem;
      height: 2.1rem;
      font-size: 0.86rem;
    }

    .property-list {
      display: grid;
      gap: 0.5rem;
    }

    .property-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 0.45rem;
      align-items: center;
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

      .inline-form,
      .property-row,
      .section-head {
        grid-template-columns: 1fr;
      }

      .note-panels {
        grid-template-columns: 1fr;
      }

      .secondary-action,
      .icon-action,
      .save-button {
        justify-self: start;
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
  readonly cardTypes = computed(() => this.worldsStore.getCardTypes().filter((type) => !type.deleted));
  readonly isLoadingCardTypes = computed(() => this.worldsStore.isLoadingCardTypes());
  readonly isCreatingCardFromType = signal(false);
  readonly cardTypeNameByCardId = signal<Record<number, string>>({});
  readonly titleDraftByCardId = signal<Record<number, string>>({});
  readonly aliasesByCardId = signal<Record<number, string[]>>({});
  readonly propertiesByCardId = signal<Record<number, CardPropertyDraft[]>>({});
  readonly aliasInputByCardId = signal<Record<number, string>>({});
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

  readonly visibleCards = computed(() => {
    const openCards = this.openCards();
    if (!openCards.length) {
      return [];
    }

    const activeId = this.activeCardId();
    if (activeId === null) {
      return openCards.slice(0, 2);
    }

    const cardMap = new Map(openCards.map((card) => [card.id, card]));
    const orderedIds = [activeId, ...[...this.openCardIds()].reverse().filter((id) => id !== activeId)];
    const visibleIds = orderedIds.slice(0, 2);

    return visibleIds
      .map((id) => cardMap.get(id))
      .filter((card): card is WorldCard => card !== undefined);
  });

  readonly cardForm = this.formBuilder.group({
    cardTypeId: [null as number | null, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const worldId = this.routeWorldId();
      if (worldId <= 0) {
        return;
      }

      this.worldsStore.loadCardsByWorldId(worldId);
      this.worldsStore.loadCardTypes(worldId);
    });

    effect(() => {
      const cards = this.cards();
      this.cardTypeNameByCardId.update((current) => {
        let next = current;
        for (const card of cards) {
          if (next[card.id] !== undefined) {
            continue;
          }

          const parsedType = this.extractTypeFromDescription(card.description);
          if (parsedType) {
            next = { ...next, [card.id]: parsedType };
          }
        }

        return next;
      });
    });

    effect(() => {
      const cards = this.openCards();
      for (const card of cards) {
        this.titleDraftByCardId.update((current) =>
          current[card.id] !== undefined
            ? current
            : { ...current, [card.id]: card.title }
        );

        this.aliasesByCardId.update((current) =>
          current[card.id] !== undefined
            ? current
            : { ...current, [card.id]: [] }
        );

        this.propertiesByCardId.update((current) =>
          current[card.id] !== undefined
            ? current
            : { ...current, [card.id]: [] }
        );

        this.aliasInputByCardId.update((current) =>
          current[card.id] !== undefined
            ? current
            : { ...current, [card.id]: '' }
        );
      }
    });
  }

  get cardTypeControl() {
    return this.cardForm.controls.cardTypeId;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  isVisibleCard(cardId: number): boolean {
    return this.visibleCards().some((card) => card.id === cardId);
  }

  getCardTypeLabel(card: WorldCard): string {
    return this.cardTypeNameByCardId()[card.id] ?? this.extractTypeFromDescription(card.description) ?? 'Sem tipo';
  }

  getTitleDraft(card: WorldCard): string {
    return this.titleDraftByCardId()[card.id] ?? card.title;
  }

  onTitleDraftInput(cardId: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.titleDraftByCardId.update((current) => ({
      ...current,
      [cardId]: target?.value ?? '',
    }));
  }

  commitTitle(card: WorldCard): void {
    const draft = (this.titleDraftByCardId()[card.id] ?? card.title).trim();
    if (!draft) {
      this.titleDraftByCardId.update((current) => ({
        ...current,
        [card.id]: card.title,
      }));
      return;
    }

    this.titleDraftByCardId.update((current) => ({
      ...current,
      [card.id]: draft,
    }));

    if (draft === card.title) {
      return;
    }

    this.worldsStore.updateCardTitleLocally(this.routeWorldId(), card.id, draft);
  }

  getAliasInput(cardId: number): string {
    return this.aliasInputByCardId()[cardId] ?? '';
  }

  onAliasInput(cardId: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.aliasInputByCardId.update((current) => ({
      ...current,
      [cardId]: target?.value ?? '',
    }));
  }

  addAlias(cardId: number): void {
    const alias = this.getAliasInput(cardId).trim();
    if (!alias) {
      return;
    }

    this.aliasesByCardId.update((current) => {
      const aliases = current[cardId] ?? [];
      if (aliases.some((item) => item.toLowerCase() === alias.toLowerCase())) {
        return current;
      }

      return {
        ...current,
        [cardId]: [...aliases, alias],
      };
    });

    this.aliasInputByCardId.update((current) => ({
      ...current,
      [cardId]: '',
    }));
  }

  getCardAliases(cardId: number): string[] {
    return this.aliasesByCardId()[cardId] ?? [];
  }

  removeAlias(cardId: number, alias: string): void {
    this.aliasesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).filter((item) => item !== alias),
    }));
  }

  getCardProperties(cardId: number): CardPropertyDraft[] {
    return this.propertiesByCardId()[cardId] ?? [];
  }

  addProperty(cardId: number): void {
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: [...(current[cardId] ?? []), { key: '', value: '' }],
    }));
  }

  removeProperty(cardId: number, index: number): void {
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  onPropertyKeyInput(cardId: number, index: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, key: target?.value ?? '' }
          : item
      ),
    }));
  }

  onPropertyValueInput(cardId: number, index: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, value: target?.value ?? '' }
          : item
      ),
    }));
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

  createCardFromSelectedType(): void {
    if (this.isCreatingCardFromType()) {
      return;
    }

    const selectedTypeId = this.cardTypeControl.value;
    const selectedType = this.cardTypes().find((type) => type.id === selectedTypeId);
    if (!selectedType || !this.world()) {
      return;
    }

    this.isCreatingCardFromType.set(true);

    const timestamp = new Date().toLocaleString('pt-BR');
    const title = `Novo nome do ${selectedType.cardTypeName}`;
    const description = [
      `Tipo: ${selectedType.cardTypeName}`,
      '',
      'Resumo inicial:',
      '- Defina os pontos principais deste card.',
      '- Adicione detalhes relevantes para o mundo.',
      '',
      `Criado em: ${timestamp}`,
    ].join('\n');

    this.worldsStore.createCard(this.routeWorldId(), title, description, selectedType.id).subscribe({
      next: (createdCard) => {
        this.cardTypeNameByCardId.update((current) => ({
          ...current,
          [createdCard.id]: selectedType.cardTypeName,
        }));
        this.titleDraftByCardId.update((current) => ({
          ...current,
          [createdCard.id]: createdCard.title,
        }));
        this.aliasesByCardId.update((current) => ({
          ...current,
          [createdCard.id]: [],
        }));
        this.propertiesByCardId.update((current) => ({
          ...current,
          [createdCard.id]: [],
        }));
        this.searchTerm.set('');
        this.openCard(createdCard.id);
        this.cardForm.patchValue({ cardTypeId: null });
        this.cardTypeControl.markAsUntouched();
        this.isCreatingCardFromType.set(false);
      },
      error: () => {
        this.isCreatingCardFromType.set(false);
      },
    });
  }

  private extractTypeFromDescription(description: string): string | null {
    const firstLine = description.split('\n')[0]?.trim();
    if (!firstLine) {
      return null;
    }

    const normalized = firstLine.toLowerCase();
    if (!normalized.startsWith('tipo:')) {
      return null;
    }

    const typeName = firstLine.slice(firstLine.indexOf(':') + 1).trim();
    return typeName || null;
  }

}
