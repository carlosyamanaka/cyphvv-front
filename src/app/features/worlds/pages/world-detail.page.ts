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

const CREATE_CARD_TYPE_OPTION_VALUE = '__create_new_card_type__';

@Component({
  selector: 'app-world-detail-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vault-page">
      @if (world(); as selectedWorld) {
        <div class="vault-shell">
          <aside class="vault-sidebar">
              <a class="back-link sidebar-back-link" routerLink="/mundos">Voltar para mundos</a>
              <section class="sidebar-world">
                <p class="sidebar-label">Mundo</p>
                <h1>{{ selectedWorld.name }}</h1>
                <p class="sidebar-summary">{{ selectedWorld.summary }}</p>
              </section>

              <section class="sidebar-create" aria-label="Criacao de card">
                <h2>Novo card</h2>
                <form [formGroup]="cardForm" novalidate>
                  <label for="card-type">Tipo do card</label>
                  <div class="card-type-selector">
                    @if (isCreateTypePopoverOpen()) {
                      <section class="card-type-popover" aria-label="Criar novo tipo de card">
                        <p class="field-hint">Novo tipo de card</p>
                        <input
                          id="new-card-type"
                          type="text"
                          maxlength="60"
                          placeholder="Ex.: Facção"
                          [value]="newCardTypeName()"
                          (input)="onNewCardTypeNameInput($event)"
                        />
                        <div class="popover-actions">
                          <button type="button" class="secondary-action" (click)="cancelCreateCardType()">Cancelar</button>
                          <button
                            type="button"
                            class="save-button"
                            [disabled]="isCreatingCardType()"
                            (click)="submitCreateCardType()"
                          >
                            Criar tipo
                          </button>
                        </div>
                      </section>
                    }

                    <select
                      id="card-type"
                      formControlName="cardTypeId"
                      [disabled]="isLoadingCardTypes() || isCreatingCardFromType() || isCreatingCardType()"
                    >
                      <option [ngValue]="null">Selecione um tipo</option>
                      @for (type of cardTypes(); track type.id) {
                        <option [ngValue]="type.id">{{ type.cardTypeName }}</option>
                      }
                    </select>

                    <button
                      type="button"
                      class="primary-action"
                      [disabled]="cardTypeControl.value === null || isLoadingCardTypes() || isCreatingCardFromType() || isCreatingCardType()"
                      (click)="createCardFromSelectedType()"
                    >
                      + Criar Card
                    </button>
                  </div>

                  @if (isLoadingCardTypes()) {
                    <p class="field-hint">Carregando tipos de card...</p>
                  }

                  @if (isCreatingCardFromType()) {
                    <p class="field-hint">Criando card padrao...</p>
                  }

                  @if (isCreatingCardType()) {
                    <p class="field-hint">Criando novo tipo de card...</p>
                  }

                  <p class="field-hint">Selecione um tipo e clique em + Criar Card para gerar um novo card com conteudo padrao.</p>
                </form>
              </section>

              <section class="notes-tree" aria-label="Lista de cards">
                <div class="tree-head">
                  <h2>Cards</h2>
                  <span>{{ filteredCards().length }}</span>
                </div>

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
                      [attr.aria-label]="'Abrir card ' + card.cardName"
                    >
                      <p class="tree-item-title">{{ card.cardName }}</p>
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
                              <p class="note-type">Tipo: {{ getCardTypeLabel(selectedCard) }}</p>
                            </div>
                            <button
                              type="button"
                              class="panel-close"
                              (click)="closeCard(selectedCard.id)"
                              [attr.aria-label]="'Fechar nota ' + selectedCard.cardName"
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
                            [value]="getCardNameDraft(selectedCard)"
                            (input)="onCardNameDraftInput(selectedCard.id, $event)"
                            (blur)="commitCardName(selectedCard)"
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
                    <div class="empty-icon" aria-hidden="true">
                      <img
                        class="empty-icon-img"
                        src="/icons/no-notes.svg"
                        alt=""
                        width="320"
                        height="320"
                        decoding="async"
                      />
                    </div>
                    <p class="empty-state-text">Nenhuma nota aberta</p>
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
      position: relative;
      isolation: isolate;
      width: 100vw;
      max-width: none;
      margin-left: calc(50% - 50vw);
      padding: 0.1rem;
      display: grid;
      gap: 0.5rem;
      overflow: hidden;
      min-height: calc(100vh - 4.5rem);
      font-size: 0.98rem;
    }

    .vault-page::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -2;
      background:
        linear-gradient(160deg, rgba(8, 9, 13, 0.78) 0%, rgba(12, 13, 18, 0.84) 55%, rgba(7, 8, 12, 0.9) 100%),
        url('/img/tower.jpg') center / cover no-repeat;
      transform: scale(1.05);
      filter: blur(8px) saturate(0.95);
    }

    .vault-page::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: radial-gradient(circle at 32% 20%, rgba(181, 92, 43, 0.14) 0%, rgba(12, 14, 21, 0.12) 35%, rgba(9, 10, 16, 0.62) 100%);
      pointer-events: none;
    }

    .back-link,
    .back-home-link {
      color: #e7e4de;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.72rem;
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      opacity: 0.88;
      padding: 0.12rem 0.22rem;
      border-radius: 0.35rem;
      line-height: 1.1;
    }

    .sidebar-back-link {
      justify-self: start;
      margin: 0 0 0.15rem;
      opacity: 0.78;
    }

    .back-link:hover,
    .back-home-link:hover {
      text-decoration: underline;
    }

    .vault-shell {
      margin: 0.2rem auto 0;
      width: min(100%, 1320px);
      min-height: auto;
      border-radius: 1rem;
      overflow: hidden;
      background: rgba(7, 8, 13, 0.36);
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.34);
      backdrop-filter: blur(12px);
    }

    .vault-sidebar {
      background: linear-gradient(180deg, rgba(9, 10, 15, 0.72) 0%, rgba(11, 12, 18, 0.74) 100%);
      padding: 0.6rem;
      display: grid;
      align-content: start;
      gap: 0.75rem;
      max-height: none;
      overflow: visible;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar-world,
    .sidebar-create,
    .notes-tree,
    .open-notes-shell,
    .not-found {
      border-radius: 0.7rem;
      background: rgba(20, 20, 24, 0.68);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
      padding: 0.65rem;
    }

    .sidebar-label {
      margin: 0;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.66rem;
      font-weight: 700;
    }

    .vault-sidebar h1 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: clamp(0.95rem, 2vw, 1.15rem);
      line-height: 1.2;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      hyphens: auto;
    }

    .sidebar-summary {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.45;
      font-size: 0.78rem;
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
      font-size: 0.82rem;
    }

    .sidebar-create form {
      margin-top: 0.4rem;
      display: grid;
      gap: 0.45rem;
    }

    .card-type-selector {
      position: relative;
      display: grid;
      gap: 0.45rem;
    }

    .card-type-popover {
      position: absolute;
      left: 0;
      right: 0;
      bottom: calc(100% + 0.45rem);
      border-radius: 0.65rem;
      background: #1d2532;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      padding: 0.7rem;
      display: grid;
      gap: 0.55rem;
      border: none;
    }

    .popover-actions {
      display: flex;
      justify-content: end;
      gap: 0.45rem;
    }

    .notes-tree {
      display: grid;
      gap: 0.55rem;
      background: linear-gradient(160deg, rgba(31, 39, 52, 0.9) 0%, rgba(36, 32, 43, 0.9) 100%);
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
      border-radius: 9999px;
      padding: 0.1rem 0.5rem;
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      border: none;
    }

    .search-label {
      color: var(--color-text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
    }

    .search-input {
      width: 100%;
      border-radius: 0.45rem;
      background: rgba(50, 50, 58, 0.44);
      padding: 0.28rem 0.52rem;
      font-size: 0.8rem;
      min-height: 1.85rem;
      color: var(--color-text-primary);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18);
      border: none;
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
      border-radius: 0.5rem;
      background: rgba(28, 29, 35, 0.8);
      padding: 0.45rem 0.5rem;
      text-align: left;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .tree-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .tree-item.is-active {
      border-color: transparent;
      box-shadow: inset 0 0 0 2px rgba(102, 169, 255, 0.4), 0 2px 8px rgba(102, 169, 255, 0.12);
    }

    .tree-item:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    .tree-item-title {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .tree-item-date {
      margin: 0.2rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.68rem;
    }

    .tree-empty {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.86rem;
      line-height: 1.4;
    }

    .vault-editor {
      padding: 0.8rem 1.2rem;
      display: grid;
      gap: 0.9rem;
      align-content: start;
      justify-items: center;
      background: linear-gradient(180deg, rgba(12, 14, 21, 0.4) 0%, rgba(10, 12, 19, 0.42) 100%);
      max-height: none;
      overflow: visible;
    }

    .open-notes-shell {
      width: min(100%, 1020px);
      margin: 0 auto;
      min-height: 100%;
      display: grid;
      align-content: start;
      gap: 0.75rem;
      border-radius: 0.9rem;
      background: rgba(10, 11, 17, 0.56);
      backdrop-filter: blur(8px);
    }

    .open-notes-header p {
      margin: 0.4rem 0 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .note-panel,
    .empty-state {
      border-radius: 0.72rem;
      background: linear-gradient(180deg, rgba(20, 22, 30, 0.88) 0%, rgba(15, 17, 24, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      padding: 0.85rem;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
      min-height: 320px;
    }

    .empty-state {
      display: grid;
      place-items: center;
      align-content: center;
      justify-items: center;
      gap: 0.35rem;
      padding: 1.2rem;
    }

    .empty-icon {
      width: min(320px, 85%);
      aspect-ratio: 1 / 1;
      display: grid;
      place-items: center;
      background: transparent;
      border: none;
      box-shadow: none;
      border-radius: 0;
    }

    .empty-icon-img {
      width: 72%;
      height: 72%;
      object-fit: contain;
      filter: none;
      opacity: 0.92;
    }

    .empty-state-text {
      margin: 0;
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 0.86rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: normal;
      line-height: 1.35;
    }

    .note-panels {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    .note-panels.note-panels-single {
      grid-template-columns: minmax(0, 1fr);
    }

    label {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.8rem;
    }

    input,
    select,
    textarea {
      width: 100%;
      border-radius: 0.5rem;
      background: rgba(50, 50, 58, 0.56);
      padding: 0.52rem 0.62rem;
      font-size: 0.84rem;
      color: var(--color-text-primary);
      resize: vertical;
      border: none;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
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
      color: var(--color-text-muted);
      font-size: 0.68rem;
      line-height: 1.4;
    }

    .save-button {
      margin-top: 0.35rem;
      border: 0;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue-strong) 100%);
      color: #ffffff;
      padding: 0.55rem 0.78rem;
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
      padding: 0.16rem 0.48rem;
      font-size: 0.66rem;
      font-weight: 700;
      justify-self: start;
    }

    .panel-close {
      border-radius: 0.46rem;
      background: rgba(45, 45, 54, 0.8);
      color: var(--color-text-primary);
      min-width: 1.8rem;
      min-height: 1.8rem;
      display: inline-grid;
      place-items: center;
      font-size: 0.86rem;
      line-height: 1;
      font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
      padding-top: 0.7rem;
      margin-top: 0.7rem;
      display: grid;
      gap: 0.55rem;
    }

    .note-section h4 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 0.82rem;
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
      border-radius: 0.55rem;
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      cursor: pointer;
      font-weight: 600;
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .alias-chip {
      padding: 0.26rem 0.46rem;
      font-size: 0.72rem;
    }

    .secondary-action {
      padding: 0.36rem 0.52rem;
      font-size: 0.72rem;
      white-space: nowrap;
    }

    .primary-action {
      border-radius: 0.52rem;
      border: none;
      background: linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue-strong) 100%);
      color: #ffffff;
      padding: 0.58rem 0.72rem;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(102, 169, 255, 0.22);
      transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
      justify-self: start;
    }

    .primary-action:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.05);
      box-shadow: 0 6px 18px rgba(102, 169, 255, 0.28);
    }

    .primary-action:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      box-shadow: none;
      transform: none;
    }

    .icon-action {
      width: 1.8rem;
      height: 1.8rem;
      font-size: 0.76rem;
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
      font-size: 1.02rem;
    }

    .note-panel p,
    .empty-state p:not(.empty-state-text) {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.5;
      font-size: 0.82rem;
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
        border-right: none;
        border-bottom: none;
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
      .primary-action,
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
  readonly isCreatingCardType = signal(false);
  readonly isCreateTypePopoverOpen = signal(false);
  readonly newCardTypeName = signal('');
  readonly createCardTypeOptionValue = CREATE_CARD_TYPE_OPTION_VALUE;
  readonly cardTypeNameByCardId = signal<Record<number, string>>({});
  readonly cardNameDraftByCardId = signal<Record<number, string>>({});
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
      card.cardName.toLowerCase().includes(query)
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
    cardTypeId: [null as number | string | null, [Validators.required]],
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
        this.cardNameDraftByCardId.update((current) =>
          current[card.id] !== undefined
            ? current
            : { ...current, [card.id]: card.cardName }
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

  getCardNameDraft(card: WorldCard): string {
    return this.cardNameDraftByCardId()[card.id] ?? card.cardName;
  }

  onCardNameDraftInput(cardId: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.cardNameDraftByCardId.update((current) => ({
      ...current,
      [cardId]: target?.value ?? '',
    }));
  }

  commitCardName(card: WorldCard): void {
    const draft = (this.cardNameDraftByCardId()[card.id] ?? card.cardName).trim();
    if (!draft) {
      this.cardNameDraftByCardId.update((current) => ({
        ...current,
        [card.id]: card.cardName,
      }));
      return;
    }

    this.cardNameDraftByCardId.update((current) => ({
      ...current,
      [card.id]: draft,
    }));

    if (draft === card.cardName) {
      return;
    }

    this.worldsStore.updateCardNameLocally(this.routeWorldId(), card.id, draft);
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
    if (this.isCreatingCardFromType() || this.isCreatingCardType()) {
      return;
    }

    const selectedTypeId = this.cardTypeControl.value;

    const selectedType = this.cardTypes().find((type) => type.id === selectedTypeId);
    if (!selectedType || !this.world()) {
      return;
    }

    this.isCreateTypePopoverOpen.set(false);

    this.isCreatingCardFromType.set(true);

    const timestamp = new Date().toLocaleString('pt-BR');
    const normalizedTypeName = selectedType.cardTypeName?.trim() || 'Sem tipo';
    const cardName = `Card do tipo (${normalizedTypeName})`;
    const description = [
      `Tipo: ${normalizedTypeName}`,
      '',
      'Resumo inicial:',
      '- Defina os pontos principais deste card.',
      '- Adicione detalhes relevantes para o mundo.',
      '',
      `Criado em: ${timestamp}`,
    ].join('\n');

    this.worldsStore.createCard(this.routeWorldId(), cardName, description, selectedType.id).subscribe({
      next: (createdCard) => {
        this.cardTypeNameByCardId.update((current) => ({
          ...current,
          [createdCard.id]: selectedType.cardTypeName,
        }));
        this.cardNameDraftByCardId.update((current) => ({
          ...current,
          [createdCard.id]: createdCard.cardName,
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
        this.worldsStore.loadCardsByWorldId(this.routeWorldId());
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

  onNewCardTypeNameInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newCardTypeName.set(target?.value ?? '');
  }

  cancelCreateCardType(): void {
    this.isCreateTypePopoverOpen.set(false);
    this.newCardTypeName.set('');
    this.cardForm.patchValue({ cardTypeId: null });
  }

  submitCreateCardType(): void {
    const worldId = this.routeWorldId();
    if (worldId <= 0) {
      this.cardForm.patchValue({ cardTypeId: null });
      return;
    }

    const cardTypeName = this.newCardTypeName().trim();
    if (!cardTypeName) {
      return;
    }

    if (this.isCreatingCardType()) {
      return;
    }

    this.isCreatingCardType.set(true);

    this.worldsStore.createCardType(worldId, cardTypeName).subscribe({
      next: (createdType) => {
        this.cardForm.patchValue({ cardTypeId: null });
        this.isCreateTypePopoverOpen.set(false);
        this.newCardTypeName.set('');
        this.isCreatingCardType.set(false);
      },
      error: () => {
        this.cardForm.patchValue({ cardTypeId: null });
        this.isCreatingCardType.set(false);
      },
    });
  }

  private openCreateCardTypePopover(): void {
    this.cardForm.patchValue({ cardTypeId: null });
    this.isCreateTypePopoverOpen.set(true);
  }

  private extractTypeFromDescription(description?: string | null): string | null {
    if (!description) {
      return null;
    }

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
