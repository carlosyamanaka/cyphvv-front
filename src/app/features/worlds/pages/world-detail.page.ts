import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Subject, debounceTime, tap } from 'rxjs';
import { LucideAngularModule, Ghost, ScrollText, User, Calendar, Shield, Map as MapIcon, Users, Eye, Crosshair, Star, MapPin, Crown, BookOpen, Sun, Book, FileQuestion, AlignLeft, Type, Trash2, ChevronDown } from 'lucide-angular';
import { WorldsStore } from '../data-access/worlds.store';
import { WorldCard } from '../models/world-card.model';

export interface CardSection {
  id?: number;
  type: string;
  content: string;
}

interface CardPropertyDraft {
  typeId: number | null;
  cardIds: number[];
  key?: string;
  value?: string;
}

const CREATE_CARD_TYPE_OPTION_VALUE = '__create_new_card_type__';

@Component({
  selector: 'app-world-detail-page',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
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

              <section class="notes-tree" aria-label="Lista de cards">
                <div class="tree-head">
                  <h2>Cards</h2>
                  <span>{{ filteredCards().length }}</span>
                </div>

                <input
                  id="card-search"
                  type="search"
                  class="search-input"
                  placeholder="Buscar por titulo"
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
                <div class="tree-empty-state">
                  <lucide-icon [img]="GhostIcon" [size]="32" class="tree-empty-icon" strokeWidth="1.5"></lucide-icon>
                  <p class="tree-empty-text">Nenhuma nota por aqui ainda...</p>
                </div>
              }
                </div>
              </section>

              <section class="sidebar-new-card">
                <button
                  type="button"
                  class="floating-create-button"
                  [disabled]="isLoadingCardTypes() || isCreatingCardFromType() || !cardTypes().length"
                  (click)="openNewCardModal()"
                >
                  + Novo Cartão
                </button>
                @if (isLoadingCardTypes()) {
                  <p class="field-hint">Carregando tipos de card...</p>
                }
                @if (isCreatingCardFromType()) {
                  <p class="field-hint">Criando card padrao...</p>
                }
              </section>
          </aside>

            <main class="vault-editor" aria-label="Notas abertas">
              <section class="open-notes-shell">

                @if (openCards().length) {
                  <section
                    class="note-panels"
                    [class.note-panels-single]="visibleCards().length === 1"
                    [class.note-panels-double]="visibleCards().length === 2"
                    [class.note-panels-triple]="visibleCards().length === 3"
                    aria-label="Visualizacao simultanea de cards"
                  >
                    @for (selectedCard of visibleCards(); track selectedCard.id) {
                      <article class="note-panel" role="tabpanel">
                        <div class="note-panel-actions">
                          <button
                            type="button"
                            class="icon-btn panel-close"
                            (click)="closeCard(selectedCard.id)"
                            [attr.aria-label]="'Fechar nota ' + selectedCard.cardName"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                        <div class="note-panel-grid">
                          <div class="note-panel-content">
                            <header class="note-header-inline">
                              <input
                                [id]="'card-name-' + selectedCard.id"
                                type="text"
                                class="title-input-large"
                                maxlength="80"
                                [value]="getCardNameDraft(selectedCard)"
                                (input)="onCardNameDraftInput(selectedCard.id, $event)"
                                (blur)="commitCardName(selectedCard)"
                              />
                              <div class="note-meta-actions">
                                <span class="note-type-inline">
                                  <lucide-icon [img]="getCardIcon(selectedCard)" [size]="14" strokeWidth="2.5"></lucide-icon>
                                  {{ getCardTypeLabel(selectedCard) }}
                                </span>
                              </div>
                            </header>

                            <section class="aliases-inline-section">
                              <div class="aliases-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                <strong>Aliases</strong>
                              </div>
                              <div class="alias-chips-container">
                                @for (alias of getCardAliases(selectedCard.id); track alias) {
                                  <div class="alias-chip-inline">
                                    {{ alias }} 
                                    <button class="remove-alias" (click)="removeAlias(selectedCard.id, alias)">x</button>
                                  </div>
                                }
                                <div class="alias-input-wrapper">
                                  <input
                                    type="text"
                                    class="discreet-input"
                                    placeholder="+ Adicionar"
                                    [value]="getAliasInput(selectedCard.id)"
                                    (input)="onAliasInput(selectedCard.id, $event)"
                                    (keyup.enter)="addAlias(selectedCard.id)"
                                    (blur)="addAlias(selectedCard.id)"
                                  />
                                </div>
                              </div>
                            </section>

                            <section class="note-section" style="border: none; padding-top: 0; margin-top: 0.5rem;">
                              <div class="section-head" style="position: relative;">
                                <button type="button" class="secondary-action add-prop-btn" (click)="openAddPropertyPopover(selectedCard.id)">+ Adicionar Propriedade</button>
                                
                                @if (activePropertyPopoverCardId() === selectedCard.id) {
                                  <div class="property-type-popover">
                                    <div class="popover-header">
                                      <lucide-icon [img]="AlignLeftIcon" [size]="14"></lucide-icon>
                                      <span>Nome da propriedade</span>
                                    </div>
                                    <div class="popover-section-title">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                      TIPO
                                    </div>
                                    <button type="button" class="type-option" (click)="selectPropertyType(selectedCard.id, null)">
                                      <lucide-icon [img]="TypeIcon" [size]="14"></lucide-icon>
                                      Texto
                                    </button>
                                    <div class="type-options-list">
                                      @for (type of cardTypes(); track type.id) {
                                        <button type="button" class="type-option indented" (click)="selectPropertyType(selectedCard.id, type.id)">
                                          <lucide-icon [img]="getIcon(type.iconType)" [size]="14"></lucide-icon>
                                          {{ type.cardTypeName }}
                                        </button>
                                      }
                                    </div>
                                  </div>
                                }
                              </div>

                              @if (getCardProperties(selectedCard.id).length) {
                                <div class="property-list" style="margin-top: 1rem;">
                                  @for (property of getCardProperties(selectedCard.id); track $index; let propIndex = $index) {
                                    <div class="property-row linked-cards-row">
                                      <div class="property-type-label">
                                         @if (property.typeId !== null) {
                                           <lucide-icon [img]="getIcon(getType(property.typeId)?.iconType)" [size]="14" strokeWidth="2.5"></lucide-icon>
                                         } @else {
                                           <lucide-icon [img]="TypeIcon" [size]="14" strokeWidth="2.5"></lucide-icon>
                                         }
                                         <input 
                                           type="text" 
                                           class="prop-name-input" 
                                           [class.is-editing]="renamingPropertyId() === selectedCard.id + '-' + propIndex"
                                           [readonly]="renamingPropertyId() !== selectedCard.id + '-' + propIndex"
                                           [value]="property.key || (property.typeId ? getType(property.typeId)?.cardTypeName : 'Texto')"
                                           (dblclick)="startRenamingProperty(selectedCard.id, propIndex, $event)"
                                           (blur)="stopRenamingProperty()"
                                           (keyup.enter)="stopRenamingProperty()"
                                           (input)="onPropertyKeyInput(selectedCard.id, propIndex, $event)"
                                         >
                                      </div>
                                      <div class="property-cards-container">
                                         @if (property.typeId === null) {
                                           <input type="text" class="property-text-input" placeholder="Valor do texto..." [value]="property.value || ''" (input)="onPropertyValueInput(selectedCard.id, propIndex, $event)">
                                         } @else {
                                           @for (relCardId of property.cardIds; track relCardId) {
                                             <div class="linked-card-chip">
                                               <lucide-icon [img]="getCardIconById(relCardId)" [size]="12" strokeWidth="2.5"></lucide-icon>
                                               <span>{{ getCardName(relCardId) }}</span>
                                               <button class="remove-chip" (click)="removePropertyCard(selectedCard.id, propIndex, relCardId)">x</button>
                                             </div>
                                           }
                                           <div class="card-select-custom-wrapper" style="position: relative; flex: 1;">
                                             <button type="button" class="card-select-custom-trigger card-select-inline" (click)="toggleCardSelectPopover(selectedCard.id, propIndex)">
                                               <span>Selecione {{ getType(property.typeId)?.cardTypeName }}(s)</span>
                                               <lucide-icon [img]="ChevronDownIcon" [size]="14"></lucide-icon>
                                             </button>
                                             
                                             @if (activeCardSelectPopoverId() === selectedCard.id + '-' + propIndex) {
                                               <div class="card-select-popover">
                                                  @for (c of getCardsByType(property.typeId); track c.id) {
                                                    <button type="button" class="card-option" [disabled]="property.cardIds.includes(c.id)" (click)="selectCardForProperty(selectedCard.id, propIndex, c.id)">
                                                       <lucide-icon [img]="getCardIconById(c.id)" [size]="14"></lucide-icon>
                                                       {{ c.cardName }}
                                                    </button>
                                                  } @empty {
                                                    <div class="card-option-empty">Nenhum card deste tipo encontrado</div>
                                                  }
                                               </div>
                                             }
                                           </div>
                                         }
                                         <button class="remove-property-btn" (click)="removeProperty(selectedCard.id, propIndex)" aria-label="Remover linha">
                                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                         </button>
                                      </div>
                                    </div>
                                  }
                                </div>
                              }
                            </section>

                            <section class="note-sections">
                              @for (section of getCardSections(selectedCard.id); track $index) {
                                <div class="card-section">
                                  <div class="section-header">
                                    <div class="section-type-label">
                                      @if (section.type === 'description') {
                                        <lucide-icon [img]="AlignLeftIcon" [size]="14" strokeWidth="2.5"></lucide-icon>
                                        <span>Descrição</span>
                                      } @else {
                                        <lucide-icon [img]="TypeIcon" [size]="14" strokeWidth="2.5"></lucide-icon>
                                        <span>Texto</span>
                                      }
                                    </div>
                                    <button
                                      type="button"
                                      class="section-delete-btn"
                                      aria-label="Remover seção"
                                      (click)="removeSection(selectedCard.id, $index)"
                                    >
                                      <lucide-icon [img]="TrashIcon" [size]="14" strokeWidth="2"></lucide-icon>
                                    </button>
                                  </div>
                                  <textarea
                                    class="section-textarea"
                                    [value]="section.content"
                                    (input)="onSectionContentInput(selectedCard.id, $index, $event)"
                                    (blur)="saveSections(selectedCard.id)"
                                    placeholder="Escreva algo..."
                                  ></textarea>
                                </div>
                              }

                              <div class="add-section-actions">
                                <button type="button" class="discreet-add-btn" (click)="addSection(selectedCard.id, 'description')">
                                  <lucide-icon [img]="AlignLeftIcon" [size]="14" strokeWidth="2.5"></lucide-icon>
                                  Descrição
                                </button>
                                <button type="button" class="discreet-add-btn" (click)="addSection(selectedCard.id, 'text')">
                                  <lucide-icon [img]="TypeIcon" [size]="14" strokeWidth="2.5"></lucide-icon>
                                  Texto
                                </button>
                                @if (isSavingSections()[selectedCard.id]) {
                                  <span class="saving-indicator">Salvando...</span>
                                }
                              </div>
                            </section>
                          </div>

                          <div class="note-panel-image-col">
                            <div class="card-image-box">
                              <img 
                                [src]="selectedCard.imageUrl || '/img/dummy.jpg'" 
                                [alt]="selectedCard.cardName"
                                class="card-image"
                              />
                              <button class="add-image-btn" aria-label="Adicionar imagem">+</button>
                            </div>
                          </div>
                        </div>
                      </article>
                    }
                  </section>
                } @else {
                  <article class="empty-state">
                    <div class="empty-illustration-icon">
                      <lucide-icon [img]="ScrollTextIcon" [size]="80" strokeWidth="1"></lucide-icon>
                    </div>
                    <div class="empty-text-content">
                      <h3 class="empty-title">Nenhum card aberto</h3>
                      <p class="empty-subtitle">Selecione um card na barra lateral ou crie um novo para comecar.</p>
                    </div>
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

    @if (isNewCardModalOpen()) {
      <div class="modal-backdrop" (click)="closeNewCardModal()">
        <section class="new-card-modal" aria-label="Selecionar tipo do card" (click)="$event.stopPropagation()">
          <div class="new-card-modal-head">
            <h3>Novo cartao</h3>
            <button type="button" class="icon-action modal-close" aria-label="Fechar janela" (click)="closeNewCardModal()">x</button>
          </div>
          
          @if (!isCreateTypePopoverOpen()) {
            
            <input
              type="search"
              class="search-input"
              placeholder="Buscar tipos..."
              [value]="cardTypeSearchTerm()"
              (input)="onCardTypeSearchInput($event)"
            />

            <div class="new-card-type-grid">
              @for (type of filteredCardTypes(); track type.id) {
                <button
                  type="button"
                  class="new-card-type-option"
                  [disabled]="isCreatingCardFromType()"
                  (click)="createCardFromType(type.id)"
                >
                  <lucide-icon [img]="getIcon(type.iconType)" [size]="16" strokeWidth="2"></lucide-icon>
                  {{ type.cardTypeName }}
                </button>
              } @empty {
                @if (cardTypes().length === 0) {
                  <p class="tree-empty" style="grid-column: span 2">Nenhum tipo de card disponivel.</p>
                }
              }
              
              <button
                type="button"
                class="new-card-type-option add-new-type"
                (click)="openCreateCardTypePopover()"
              >
                + Adicionar novo tipo
              </button>
            </div>
          } @else {
            <div class="create-type-form">
              <p class="field-hint">Digite o nome do novo tipo.</p>
              <input
                type="text"
                class="search-input"
                placeholder="Nome do tipo"
                [value]="newCardTypeName()"
                (input)="onNewCardTypeNameInput($event)"
                autofocus
              />
              <input
                type="text"
                class="search-input"
                placeholder="Nome do ícone (ex: star, user, tag)"
                [value]="newCardIconType()"
                (input)="onNewCardIconTypeInput($event)"
                (keyup.enter)="submitCreateCardType()"
              />
              <div class="popover-actions">
                <button type="button" class="secondary-action" (click)="cancelCreateCardType()">Cancelar</button>
                <button 
                  type="button" 
                  class="save-button" 
                  [disabled]="isCreatingCardType() || !newCardTypeName().trim()"
                  (click)="submitCreateCardType()"
                >
                  Salvar
                </button>
              </div>
            </div>
          }
        </section>
      </div>
    }

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
        linear-gradient(160deg, rgba(8, 9, 13, 0.78) 0%, rgba(12, 13, 18, 0.84) 25%, rgba(7, 8, 12, 0.9) 50%),
        url('/img/tower.jpg') center / cover no-repeat;
      transform: scale(1.05);
      filter: blur(2px) saturate(0.95);
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
      margin: 1rem auto;
      width: 100%;
      max-width: none;
      padding: 0 1rem;
      min-height: auto;
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 0.5rem;
    }

    .vault-sidebar {
      background: linear-gradient(180deg, rgba(9, 10, 15, 0.82) 0%, rgba(11, 12, 18, 0.85) 100%);
      padding: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.34);
      backdrop-filter: blur(12px);
      max-height: calc(100vh - 6rem);
      overflow-y: auto;
    }

    .sidebar-world,
    .notes-tree,
    .sidebar-new-card,
    .not-found {
      border-radius: 0.7rem;
      background: rgba(20, 20, 24, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.04);
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

    .sidebar-new-card {
      margin-top: auto;
      display: grid;
      gap: 0.4rem;
      background: rgba(20, 20, 24, 0.38);
      border-style: dashed;
    }

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
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      background: linear-gradient(160deg, rgba(31, 39, 52, 0.9) 0%, rgba(36, 32, 43, 0.9) 100%);
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

    .floating-create-button {
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: var(--color-brand-blue);
      color: #ffffff;
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
    }

    .floating-create-button:hover:not(:disabled) {
      filter: brightness(1.06);
    }

    .floating-create-button:disabled {
      opacity: 0.56;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
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
      background: rgba(40, 42, 50, 0.85);
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

    .tree-empty-state {
      display: grid;
      place-items: center;
      gap: 0.5rem;
      padding: 2rem 1rem;
      opacity: 0.5;
    }

    .tree-empty-icon {
      color: var(--color-text-muted);
    }

    .tree-empty-text {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.8rem;
      line-height: 1.4;
      text-align: center;
    }

    .vault-editor {
      display: grid;
      align-content: start;
      gap: 0.9rem;
      justify-items: center;
      max-height: none;
      overflow: visible;
    }

    .open-notes-shell {
      width: 100%;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100%;
      display: grid;
      align-content: start;
      gap: 1.5rem;
    }

    .note-panel,
    .empty-state {
      position: relative;
      border-radius: 1rem;
      background: linear-gradient(180deg, rgba(20, 22, 30, 0.92) 0%, rgba(15, 17, 24, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.5rem;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      min-height: 320px;
    }

    .empty-state {
      display: grid;
      place-items: center;
      align-content: center;
      justify-items: center;
      padding: 4rem 1.2rem;
    }

    .empty-illustration-icon {
      color: rgba(145, 158, 212, 0.2);
      margin-bottom: 1.5rem;
      animation: floatIcon 6s ease-in-out infinite;
    }

    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .empty-text-content {
      text-align: center;
      display: grid;
      gap: 0.5rem;
    }

    .empty-title {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1.35rem;
      font-weight: 700;
    }

    .empty-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.95rem;
      max-width: 400px;
    }

    .note-panels {
      display: grid;
      gap: 0.5rem;
      align-items: start;
    }

    .note-panels.note-panels-single {
      grid-template-columns: minmax(0, 1fr);
    }

    .note-panels.note-panels-double {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .note-panels.note-panels-triple {
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
      border-radius: 0.25rem;
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

    .note-panel-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 1.5rem;
      align-items: start;
    }

    .note-panel-content {
      display: grid;
      gap: 0.85rem;
    }

    .note-header-inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .title-input-large {
      font-size: 1.6rem;
      font-weight: 700;
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
      color: var(--color-text-primary);
      width: 100%;
    }
    
    .title-input-large:focus-visible {
      outline: none;
      box-shadow: none;
    }

    .note-meta-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .note-type-inline {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: inline-flex;
      padding: 0;
    }
    .icon-btn:hover {
      color: var(--color-text-primary);
    }

    .note-panel-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.5rem;
      z-index: 10;
    }

    .panel-close {
      padding: 0.4rem;
      border-radius: 0.4rem;
      background: rgba(255, 255, 255, 0.03);
      transition: background 0.2s ease;
    }

    .panel-close:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .aliases-inline-section {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      flex-wrap: wrap;
    }

    .aliases-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--color-text-primary);
      font-size: 0.85rem;
    }

    .alias-chips-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .alias-chip-inline {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.4rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      color: var(--color-text-primary);
    }

    .remove-alias {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0;
      font-size: 0.8rem;
      line-height: 1;
    }
    .remove-alias:hover {
      color: var(--color-text-primary);
    }

    .add-alias-inline-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .discreet-input {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 0.4rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      width: 100px;
      box-shadow: none;
    }
    .discreet-input:focus-visible {
      outline: none;
      border-color: rgba(255, 255, 255, 0.3);
      color: var(--color-text-primary);
    }

    .discreet-button {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.4rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .discreet-button:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-text-primary);
    }

    .add-prop-btn {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      color: var(--color-text-secondary) !important;
      padding: 0 !important;
      font-size: 0.85rem !important;
      font-weight: 500 !important;
      justify-self: start;
    }
    .add-prop-btn:hover {
      color: var(--color-text-primary) !important;
    }

    .note-panel-image-col {
      width: 180px;
      flex-shrink: 0;
    }

    .card-image-box {
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }


    .add-image-btn {
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      background: rgba(15, 20, 30, 0.75);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      width: 2.2rem;
      height: 2.2rem;
      color: #ffffff;
      font-size: 1.3rem;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.2s ease;
      opacity: 0;
      transform: translateY(4px);
    }

    .card-image-box:hover .add-image-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .add-image-btn:hover {
      background: var(--color-brand-blue);
      border-color: transparent;
    }
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
      border-radius: 0.4rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: var(--color-brand-blue);
      color: #ffffff;
      padding: 0.5rem 0.9rem;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      justify-self: start;
    }

    .primary-action:hover:not(:disabled) {
      filter: brightness(1.05);
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

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: rgba(5, 7, 12, 0.62);
      backdrop-filter: blur(6px);
      display: grid;
      place-items: center;
      padding: 1rem;
    }

    .new-card-modal {
      width: min(100%, 420px);
      border-radius: 0.9rem;
      background: linear-gradient(180deg, rgba(22, 25, 35, 0.98) 0%, rgba(16, 18, 27, 0.98) 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.42);
      padding: 0.95rem;
      display: grid;
      gap: 0.7rem;
    }

    .new-card-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .new-card-modal-head h3 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 0.95rem;
    }

    .modal-close {
      width: 1.9rem;
      height: 1.9rem;
    }

    .new-card-type-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
      max-height: 46vh;
      overflow: auto;
      padding-right: 0.1rem;
    }

    .new-card-type-option {
      border-radius: 0.62rem;
      border: 1px solid rgba(255, 255, 255, 0.11);
      background: rgba(44, 52, 66, 0.7);
      color: var(--color-text-primary);
      padding: 0.58rem 0.65rem;
      text-align: left;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.15s ease;
    }

    .new-card-type-option:hover:not(:disabled) {
      background: rgba(70, 88, 112, 0.78);
    }

    .new-card-type-option:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .new-card-type-option.add-new-type {
      border: 1px dashed rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.02);
      justify-content: center;
      color: var(--color-text-secondary);
    }

    .new-card-type-option.add-new-type:hover {
      background: rgba(255, 255, 255, 0.06);
      color: var(--color-text-primary);
    }

    .create-type-form {
      display: grid;
      gap: 0.8rem;
    }

    .property-list {
      display: grid;
      gap: 0.5rem;
    }

    .linked-cards-row {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
      margin-bottom: 0.5rem;
    }

    .property-type-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      padding-top: 0.4rem;
    }

    .prop-name-input {
      background: transparent;
      border: 1px solid transparent;
      color: inherit;
      font-size: inherit;
      font-weight: inherit;
      padding: 0 0.2rem;
      margin-left: -0.2rem;
      width: 110px;
      outline: none;
      box-shadow: none;
      cursor: default;
      text-overflow: ellipsis;
    }
    
    .prop-name-input.is-editing {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--color-brand-blue);
      color: var(--color-text-primary);
      cursor: text;
    }

    .property-cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      background: rgba(50, 50, 58, 0.44);
      border-radius: 0.25rem;
      padding: 0.3rem 0.4rem;
      min-height: 2.4rem;
      align-items: center;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .linked-card-chip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 0.4rem;
      padding: 0.2rem 0.4rem;
      font-size: 0.75rem;
      color: var(--color-text-primary);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .remove-chip {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0 0 0 0.2rem;
      font-size: 0.8rem;
      line-height: 1;
    }

    .remove-chip:hover {
      color: var(--color-danger);
    }

    .card-select-inline {
      appearance: none;
      background: rgba(255, 255, 255, 0.03);
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.6rem center;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.4rem;
      box-shadow: none;
      color: var(--color-text-primary);
      padding: 0.3rem 2rem 0.3rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 500;
      flex: 1;
      min-width: 180px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .card-select-inline:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .card-select-inline:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: -1px;
    }

    .property-text-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.25rem;
      color: var(--color-text-primary);
      padding: 0.3rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 500;
      flex: 1;
      width: auto;
      transition: all 0.2s ease;
      outline: none;
    }

    .property-text-input:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .property-text-input:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: -1px;
    }

    .card-select-custom-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
    }

    .card-select-popover {
      position: absolute;
      top: calc(100% + 0.4rem);
      left: 0;
      right: 0;
      background: #1d2028;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      z-index: 50;
      padding: 0.3rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      max-height: 250px;
      overflow-y: auto;
    }

    .card-option {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.6rem;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      padding: 0.5rem 0.6rem;
      border-radius: 0.4rem;
      font-size: 0.8rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .card-option:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.06);
    }

    .card-option:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      color: var(--color-text-muted);
    }

    .card-option-empty {
      padding: 0.6rem;
      color: var(--color-text-muted);
      font-size: 0.8rem;
      text-align: center;
    }

    .remove-property-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.2rem;
      margin-left: auto;
      display: flex;
      align-items: center;
    }

    .remove-property-btn:hover {
      color: var(--color-danger);
    }

    .property-type-popover {
      position: absolute;
      top: calc(100% + 0.4rem);
      left: 0;
      width: 220px;
      background: #1d2028;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      z-index: 50;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .popover-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.5rem;
      color: var(--color-text-secondary);
      font-size: 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 0.2rem;
    }

    .popover-section-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.5rem;
      color: var(--color-text-muted);
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .type-options-list {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .type-option {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      padding: 0.5rem 0.6rem;
      border-radius: 0.4rem;
      font-size: 0.82rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .type-option:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .type-option.indented {
      padding-left: 1.5rem;
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

    .note-sections {
      display: grid;
      gap: 1.2rem;
      margin-top: 1rem;
    }

    .card-section {
      display: grid;
      gap: 0.4rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-delete-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 0.4rem;
      opacity: 0;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-section:hover .section-delete-btn {
      opacity: 1;
    }

    .section-delete-btn:hover {
      background: rgba(255, 68, 68, 0.12);
      color: #ff5f5f;
    }

    .section-type-label {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      color: var(--color-text-muted);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .section-textarea {
      width: 100%;
      background: rgba(50, 50, 58, 0.4);
      border: none;
      color: var(--color-text-primary);
      font-size: 0.9rem;
      line-height: 1.6;
      resize: none;
      min-height: 2.5rem;
      padding: 0.6rem;
      font-family: inherit;
      border-radius: 0.25rem;
    }

    .section-textarea:focus {
      outline: none;
    }

    .add-section-actions {
      display: flex;
      gap: 0.6rem;
      margin-top: 0.5rem;
      align-items: center;
    }

    .saving-indicator {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-left: auto;
      font-style: italic;
    }

    .discreet-add-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.5rem;
      padding: 0.35rem 0.6rem;
      color: var(--color-text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .discreet-add-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      color: var(--color-text-primary);
      transform: translateY(-1px);
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

      .note-panel-grid {
        grid-template-columns: 1fr;
      }

      .note-panel-image-col {
        width: 100%;
        max-width: 200px;
        margin: 0 auto;
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
  readonly ScrollTextIcon = ScrollText;
  readonly GhostIcon = Ghost;
  readonly AlignLeftIcon = AlignLeft;
  readonly TypeIcon = Type;
  readonly FileQuestionIcon = FileQuestion;
  readonly TrashIcon = Trash2;
  readonly ChevronDownIcon = ChevronDown;

  private readonly iconMap: Record<string, any> = {
    'user': User,
    'calendar': Calendar,
    'shield': Shield,
    'map': MapIcon,
    'users': Users,
    'eye': Eye,
    'crosshair': Crosshair,
    'star': Star,
    'map-pin': MapPin,
    'crown': Crown,
    'book-open': BookOpen,
    'sun': Sun,
    'book': Book,
    'ghost': Ghost,
    'scroll-text': ScrollText
  };

  getIcon(iconName: string | undefined): any {
    if (!iconName) return FileQuestion;
    return this.iconMap[iconName] || FileQuestion;
  }

  getCardIcon(card: WorldCard): any {
    const typeLabel = this.getCardTypeLabel(card);
    const type = this.cardTypes().find((t) => t.cardTypeName.toLowerCase() === typeLabel.toLowerCase());
    return this.getIcon(type?.iconType);
  }

  getType(typeId: number | null): any {
    if (!typeId) return null;
    return this.cardTypes().find(t => t.id === Number(typeId));
  }

  getCardsByType(typeId: number | null): WorldCard[] {
    if (!typeId) return [];
    return this.cards().filter(c => c.cardTypeId === Number(typeId));
  }

  getCardName(cardId: number): string {
    const card = this.cards().find(c => c.id === Number(cardId));
    return card ? card.cardName : 'Desconhecido';
  }

  getCardIconById(cardId: number): any {
    const card = this.cards().find(c => c.id === Number(cardId));
    if (card) {
      return this.getCardIcon(card);
    }
    return this.FileQuestionIcon;
  }

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
  readonly isNewCardModalOpen = signal(false);
  readonly isCreatingCardType = signal(false);
  readonly isCreateTypePopoverOpen = signal(false);
  readonly newCardTypeName = signal('');
  readonly newCardIconType = signal('');
  readonly createCardTypeOptionValue = CREATE_CARD_TYPE_OPTION_VALUE;
  readonly cardTypeNameByCardId = signal<Record<number, string>>({});
  readonly cardNameDraftByCardId = signal<Record<number, string>>({});
  readonly aliasesByCardId = signal<Record<number, string[]>>({});
  readonly propertiesByCardId = signal<Record<number, CardPropertyDraft[]>>({});
  readonly sectionsByCardId = signal<Record<number, CardSection[]>>({});
  readonly isSavingSections = signal<Record<number, boolean>>({});
  private readonly saveSectionsSubject = new Subject<number>();
  readonly aliasInputByCardId = signal<Record<number, string>>({});
  readonly searchTerm = signal('');
  readonly cardTypeSearchTerm = signal('');
  readonly openCardIds = signal<number[]>([]);
  readonly activeCardId = signal<number | null>(null);
  readonly activePropertyPopoverCardId = signal<number | null>(null);
  readonly renamingPropertyId = signal<string | null>(null);
  readonly activeCardSelectPopoverId = signal<string | null>(null);

  readonly filteredCards = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const allCards = this.cards();
    if (!query) {
      return allCards;
    }

    return allCards.filter((card) => {
      if (card.cardName.toLowerCase().includes(query)) return true;
      const sectionsContent = (card.sections || []).map(s => s.content).join(' ').toLowerCase();
      return sectionsContent.includes(query);
    });
  });

  readonly filteredCardTypes = computed(() => {
    const query = this.cardTypeSearchTerm().trim().toLowerCase();
    const allTypes = this.cardTypes();
    if (!query) {
      return allTypes;
    }

    return allTypes.filter((type) =>
      type.cardTypeName.toLowerCase().includes(query)
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
      return openCards.slice(0, 3);
    }

    const cardMap = new Map(openCards.map((card) => [card.id, card]));
    const orderedIds = [activeId, ...[...this.openCardIds()].reverse().filter((id) => id !== activeId)];
    const visibleIds = orderedIds.slice(0, 3);

    return visibleIds
      .map((id) => cardMap.get(id))
      .filter((card): card is WorldCard => card !== undefined);
  });

  readonly cardForm = this.formBuilder.group({
    cardTypeId: [null as number | string | null, [Validators.required]],
  });

  constructor() {
    this.saveSectionsSubject.pipe(
      tap(cardId => this.isSavingSections.update(current => ({ ...current, [cardId]: true }))),
      debounceTime(1000)
    ).subscribe((cardId) => {
      this.executeSaveSections(cardId);
    });

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

          const typeName = this.cardTypes().find(t => t.id === card.cardTypeId)?.cardTypeName;
          if (typeName) {
            next = { ...next, [card.id]: typeName };
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
            : { ...current, [card.id]: card.aliases ?? [] }
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

        this.sectionsByCardId.update((current) => {
          if (current[card.id] !== undefined) return current;

          const sections = card.sections ?? [];
          return { ...current, [card.id]: sections };
        });
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

  onCardTypeSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.cardTypeSearchTerm.set(target?.value ?? '');
  }

  isVisibleCard(cardId: number): boolean {
    return this.visibleCards().some((card) => card.id === cardId);
  }

  getCardTypeLabel(card: WorldCard): string {
    return this.cardTypeNameByCardId()[card.id] ?? this.cardTypes().find(t => t.id === card.cardTypeId)?.cardTypeName ?? 'Sem tipo';
  }

  getCardNameDraft(card: WorldCard): string {
    return this.cardNameDraftByCardId()[card.id] ?? card.cardName;
  }

  onCardNameDraftInput(cardId: number, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const draft = target?.value ?? '';
    this.cardNameDraftByCardId.update((current) => ({
      ...current,
      [cardId]: draft,
    }));
  }

  commitCardName(card: WorldCard): void {
    const worldId = this.routeWorldId();
    const draft = (this.cardNameDraftByCardId()[card.id] ?? '').trim();
    if (worldId <= 0 || !draft || draft === card.cardName) return;

    this.worldsStore.updateCardName(worldId, card.id, draft).subscribe();
  }

  getCardSections(cardId: number): CardSection[] {
    return this.sectionsByCardId()[cardId] ?? [];
  }

  addSection(cardId: number, type: string): void {
    this.sectionsByCardId.update((current) => ({
      ...current,
      [cardId]: [...(current[cardId] ?? []), { type, content: '' }],
    }));
    this.saveSectionsSubject.next(cardId);
  }

  removeSection(cardId: number, index: number): void {
    this.sectionsByCardId.update((current) => {
      const sections = [...(current[cardId] ?? [])];
      sections.splice(index, 1);
      return { ...current, [cardId]: sections };
    });
    this.saveSectionsSubject.next(cardId);
  }

  onSectionContentInput(cardId: number, index: number, event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    const content = target?.value ?? '';
    this.sectionsByCardId.update((current) => {
      const sections = [...(current[cardId] ?? [])];
      if (sections[index]) {
        sections[index] = { ...sections[index], content };
      }
      return { ...current, [cardId]: sections };
    });
    this.saveSectionsSubject.next(cardId);
  }

  saveSections(cardId: number): void {
    this.saveSectionsSubject.next(cardId);
  }

  private executeSaveSections(cardId: number): void {
    const worldId = this.routeWorldId();
    if (worldId <= 0) {
      this.isSavingSections.update(current => ({ ...current, [cardId]: false }));
      return;
    }

    const sections = this.sectionsByCardId()[cardId] || [];

    this.worldsStore.saveCardSections(worldId, cardId, sections).subscribe({
      next: () => {
        this.isSavingSections.update(current => ({ ...current, [cardId]: false }));
      },
      error: () => {
        this.isSavingSections.update(current => ({ ...current, [cardId]: false }));
      }
    });
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

    const worldId = this.routeWorldId();
    if (worldId <= 0) return;

    this.worldsStore.addCardAlias(worldId, cardId, alias).subscribe({
      next: (card) => {
        this.aliasesByCardId.update((current) => ({
          ...current,
          [cardId]: card.aliases ?? [],
        }));
        this.aliasInputByCardId.update((current) => ({
          ...current,
          [cardId]: '',
        }));
      },
      error: (err) => {
        console.error('Falha ao adicionar apelido', err);
      }
    });
  }

  getCardAliases(cardId: number): string[] {
    return this.aliasesByCardId()[cardId] ?? [];
  }

  removeAlias(cardId: number, alias: string): void {
    const worldId = this.routeWorldId();
    if (worldId <= 0) return;

    this.worldsStore.removeCardAlias(worldId, cardId, alias).subscribe({
      next: (card) => {
        this.aliasesByCardId.update((current) => ({
          ...current,
          [cardId]: card.aliases ?? [],
        }));
      },
      error: (err) => {
        console.error('Falha ao remover apelido', err);
      }
    });
  }

  getCardProperties(cardId: number): CardPropertyDraft[] {
    return this.propertiesByCardId()[cardId] ?? [];
  }

  openAddPropertyPopover(cardId: number): void {
    this.activePropertyPopoverCardId.update(current => current === cardId ? null : cardId);
  }

  selectPropertyType(cardId: number, typeId: number | null): void {
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: [...(current[cardId] ?? []), { typeId, cardIds: [], key: '', value: '' }],
    }));
    this.activePropertyPopoverCardId.set(null);
  }

  startRenamingProperty(cardId: number, index: number, event: MouseEvent): void {
    this.renamingPropertyId.set(`${cardId}-${index}`);
    const target = event.target as HTMLInputElement;
    target.removeAttribute('readonly');
    setTimeout(() => {
      target.focus();
      target.select();
    });
  }

  stopRenamingProperty(): void {
    this.renamingPropertyId.set(null);
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

  toggleCardSelectPopover(cardId: number, index: number): void {
    const id = `${cardId}-${index}`;
    this.activeCardSelectPopoverId.update(current => current === id ? null : id);
  }

  selectCardForProperty(cardId: number, index: number, relCardId: number): void {
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).map((item, itemIndex) =>
        itemIndex === index && !item.cardIds.includes(relCardId)
          ? { ...item, cardIds: [...item.cardIds, relCardId] }
          : item
      ),
    }));
  }

  removePropertyCard(cardId: number, index: number, relCardId: number): void {
    this.propertiesByCardId.update((current) => ({
      ...current,
      [cardId]: (current[cardId] ?? []).map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, cardIds: item.cardIds.filter(id => id !== relCardId) }
          : item
      ),
    }));
  }

  openCard(cardId: number): void {
    this.openCardIds.update((currentIds) => {
      if (currentIds.includes(cardId)) return currentIds;
      const nextIds = [...currentIds, cardId];
      if (nextIds.length > 3) {
        nextIds.shift();
      }
      return nextIds;
    });
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

    if (typeof selectedTypeId !== 'number') {
      return;
    }

    this.createCardFromType(selectedTypeId);
  }

  openNewCardModal(): void {
    this.cardTypeSearchTerm.set('');
    this.isCreateTypePopoverOpen.set(false);
    this.isNewCardModalOpen.set(true);
  }

  closeNewCardModal(): void {
    this.isNewCardModalOpen.set(false);
    this.isCreateTypePopoverOpen.set(false);
  }

  createCardFromType(cardTypeId: number): void {
    const selectedType = this.cardTypes().find((type) => type.id === cardTypeId);
    if (!selectedType || !this.world()) {
      return;
    }

    this.isCreateTypePopoverOpen.set(false);
    this.isNewCardModalOpen.set(false);

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

    this.worldsStore.createCard(this.routeWorldId(), cardName, selectedType.id).subscribe({
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

  onNewCardIconTypeInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newCardIconType.set(target?.value ?? '');
  }

  cancelCreateCardType(): void {
    this.isCreateTypePopoverOpen.set(false);
    this.newCardTypeName.set('');
    this.newCardIconType.set('');
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
    const iconType = this.newCardIconType().trim();

    this.worldsStore.createCardType(worldId, cardTypeName, iconType).subscribe({
      next: (createdType) => {
        this.cardForm.patchValue({ cardTypeId: null });
        this.isCreateTypePopoverOpen.set(false);
        this.newCardTypeName.set('');
        this.newCardIconType.set('');
        this.isCreatingCardType.set(false);
      },
      error: () => {
        this.cardForm.patchValue({ cardTypeId: null });
        this.isCreatingCardType.set(false);
      },
    });
  }

  openCreateCardTypePopover(): void {
    this.cardForm.patchValue({ cardTypeId: null });
    this.isCreateTypePopoverOpen.set(true);
  }



}
