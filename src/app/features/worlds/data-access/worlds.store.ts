import { Injectable, signal, inject, computed } from '@angular/core';
import { catchError, tap } from 'rxjs';
import { World } from '../models/world.model';
import { WorldCard, CardSection } from '../models/world-card.model';
import { CardType } from '../models/card-type.model';
import { CardRelationship } from '../models/card-relationship.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
    providedIn: 'root',
})
export class WorldsStore {
    private readonly apiService = inject(ApiService);

    readonly worlds = signal<World[]>([]);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);
    readonly cardsByWorld = signal<Record<number, WorldCard[]>>({});
    readonly isLoadingCards = signal(false);
    readonly cardTypes = signal<CardType[]>([]);
    readonly isLoadingCardTypes = signal(false);

    constructor() {
        this.loadWorlds();
    }

    loadWorlds(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.apiService.get<World[]>('/worlds').subscribe({
            next: (worlds) => {
                const formattedWorlds = worlds.map(world => this.formatWorldData(world));
                this.worlds.set(formattedWorlds);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar mundos:', error);
                this.error.set('Erro ao carregar mundos. Por favor, tente novamente.');
                this.isLoading.set(false);
            },
        });
    }

    createWorld(worldName: string) {
        return this.apiService.post<World>('/worlds', { worldName, summary: '' }).pipe(
            tap((world) => {
                const formattedWorld = this.formatWorldData(world);
                this.worlds.update((currentWorlds) => [formattedWorld, ...currentWorlds]);
            }),
            catchError((error) => {
                console.error('Erro ao criar mundo:', error);
                this.error.set('Erro ao criar mundo. Por favor, tente novamente.');
                throw error;
            })
        );
    }

    getWorldById(worldId: number): World | undefined {
        return this.worlds().find((world) => world.id === worldId);
    }

    getCardsByWorldId(worldId: number): WorldCard[] {
        return this.cardsByWorld()[worldId] ?? [];
    }

    loadCardsByWorldId(worldId: number): void {
        this.isLoadingCards.set(true);
        this.apiService.get<WorldCard[]>(`/worlds/${worldId}/cards`).subscribe({
            next: (cards) => {
                this.cardsByWorld.update((current) => ({
                    ...current,
                    [worldId]: cards.map((card) => this.normalizeCard(card)),
                }));
                this.isLoadingCards.set(false);
            },
            error: (error) => {
                console.error(`Erro ao carregar cartas do mundo ${worldId}:`, error);
                this.isLoadingCards.set(false);
            },
        });
    }

    createCard(worldId: number, cardName: string, cardTypeId: number) {
        const tempCardId = -Date.now();
        const normalizedCardName = cardName?.trim() ? cardName.trim() : 'Card do tipo (Sem tipo)';
        const optimisticCard: WorldCard = {
            id: tempCardId,
            worldId,
            cardTypeId,
            cardName: normalizedCardName,
            sections: [],
            createdAtLabel: this.formatToday(),
        };

        this.cardsByWorld.update((current) => ({
            ...current,
            [worldId]: [optimisticCard, ...(current[worldId] ?? [])],
        }));

        return this.apiService
            .post<WorldCard>(`/worlds/${worldId}/cards`, { cardName: normalizedCardName, cardTypeId })
            .pipe(
                tap((card) => {
                    const persistedCard = this.normalizeCard(card, {
                        worldId,
                        cardTypeId,
                        cardName: normalizedCardName,
                        sections: [],
                        createdAtLabel: this.formatToday(),
                    });

                    this.cardsByWorld.update((current) => ({
                        ...current,
                        [worldId]: (current[worldId] ?? []).map((currentCard) =>
                            currentCard.id === tempCardId ? persistedCard : currentCard
                        ),
                    }));
                }),
                catchError((error) => {
                    this.cardsByWorld.update((current) => ({
                        ...current,
                        [worldId]: (current[worldId] ?? []).filter((card) => card.id !== tempCardId),
                    }));

                    console.error('Erro ao criar card:', error);
                    this.error.set('Erro ao criar card. Por favor, tente novamente.');
                    throw error;
                })
            );
    }

    updateCardNameLocally(worldId: number, cardId: number, cardName: string): void {
        this.cardsByWorld.update((current) => {
            const cards = current[worldId] ?? [];
            return {
                ...current,
                [worldId]: cards.map((card) =>
                    card.id === cardId
                        ? { ...card, cardName }
                        : card
                ),
            };
        });
    }

    private normalizeCard(card: WorldCard, fallback?: Partial<WorldCard>): WorldCard {
        const rawName = card.cardName?.trim() || fallback?.cardName?.trim() || 'Sem nome';

        return {
            ...fallback,
            ...card,
            cardName: rawName,
            sections: card.sections ?? fallback?.sections ?? [],
            relationships: card.relationships ?? fallback?.relationships ?? [],
            createdAtLabel: card.createdAtLabel ?? fallback?.createdAtLabel ?? this.formatToday(),
        };
    }

    private formatToday(): string {
        return new Date().toLocaleDateString('pt-BR');
    }

    private formatWorldData(world: World): World {
        return {
            ...world,
            name: world.worldName,
            summary: '',
            createdAtLabel: this.formatDate(world.createdAt)
        };
    }

    getCardTypes(): CardType[] {
        return this.cardTypes();
    }

    loadCardTypes(worldId: number): void {
        this.isLoadingCardTypes.set(true);
        this.error.set(null);

        this.apiService.get<CardType[]>(`/worlds/${worldId}/card-types`).subscribe({
            next: (cardTypes) => {
                this.cardTypes.set(cardTypes);
                this.isLoadingCardTypes.set(false);
            },
            error: (error) => {
                console.error(`Erro ao carregar tipos de card do mundo ${worldId}:`, error);
                this.error.set('Erro ao carregar tipos de card. Por favor, tente novamente.');
                this.isLoadingCardTypes.set(false);
            },
        });
    }

    createCardType(worldId: number, cardTypeName: string, iconType: string) {
        return this.apiService
            .post<CardType>(`/worlds/${worldId}/card-types`, { cardTypeName, iconType })
            .pipe(
                tap((createdType) => {
                    this.cardTypes.update((current) => {
                        if (current.some((type) => type.id === createdType.id)) {
                            return current;
                        }

                        return [...current, createdType];
                    });
                }),
                catchError((error) => {
                    console.error('Erro ao criar tipo de card:', error);
                    this.error.set('Erro ao criar tipo de card. Por favor, tente novamente.');
                    throw error;
                })
            );
    }

    private formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    addCardAlias(worldId: number, cardId: number, alias: string) {
        return this.apiService.post<WorldCard>(`/worlds/${worldId}/cards/${cardId}/aliases`, { alias }).pipe(
            tap((updatedCard) => {
                this.updateCardInList(worldId, updatedCard);
            }),
            catchError((error) => {
                console.error('Erro ao adicionar alias:', error);
                throw error;
            })
        );
    }

    removeCardAlias(worldId: number, cardId: number, alias: string) {
        return this.apiService.delete<WorldCard>(`/worlds/${worldId}/cards/${cardId}/aliases/${alias}`).pipe(
            tap((updatedCard) => {
                this.updateCardInList(worldId, updatedCard);
            }),
            catchError((error) => {
                console.error('Erro ao remover alias:', error);
                throw error;
            })
        );
    }

    updateCardName(worldId: number, cardId: number, cardName: string) {
        return this.apiService.patch<WorldCard>(`/worlds/${worldId}/cards/${cardId}/name`, { cardName }).pipe(
            tap((updatedCard) => {
                this.updateCardInList(worldId, updatedCard);
            }),
            catchError((error) => {
                console.error('Erro ao atualizar nome do card:', error);
                throw error;
            })
        );
    }

    saveCardSections(worldId: number, cardId: number, sections: any[]) {
        return this.apiService.put<WorldCard>(`/worlds/${worldId}/cards/${cardId}/sections`, { sections }).pipe(
            tap((updatedCard) => {
                this.updateCardInList(worldId, updatedCard);
            }),
            catchError((error) => {
                console.error('Erro ao salvar seções do card:', error);
                throw error;
            })
        );
    }

    saveCardRelationships(worldId: number, cardId: number, relationships: CardRelationship[]) {
        return this.apiService.put<WorldCard>(`/worlds/${worldId}/cards/${cardId}/relationships`, { relationships }).pipe(
            tap((updatedCard) => {
                this.updateCardInList(worldId, updatedCard);
            }),
            catchError((error) => {
                console.error('Erro ao salvar propriedades do card:', error);
                throw error;
            })
        );
    }

    private updateCardInList(worldId: number, updatedCard: WorldCard) {
        this.cardsByWorld.update((current) => {
            const cards = current[worldId] ?? [];
            return {
                ...current,
                [worldId]: cards.map((card) =>
                    card.id === updatedCard.id ? this.normalizeCard(updatedCard, card) : card
                ),
            };
        });
    }
}
