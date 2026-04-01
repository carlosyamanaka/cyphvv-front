import { Injectable, signal, inject, computed } from '@angular/core';
import { catchError, tap } from 'rxjs';
import { World } from '../models/world.model';
import { WorldCard } from '../models/world-card.model';
import { CardType } from '../models/card-type.model';
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

    createWorld(worldName: string): void {
        this.apiService.post<World>('/worlds', { worldName, summary: '' }).subscribe({
            next: (world) => {
                const formattedWorld = this.formatWorldData(world);
                this.worlds.update((currentWorlds) => [formattedWorld, ...currentWorlds]);
            },
            error: (error) => {
                console.error('Erro ao criar mundo:', error);
                this.error.set('Erro ao criar mundo. Por favor, tente novamente.');
            },
        });
    }

    getWorldById(worldId: number): World | undefined {
        return this.worlds().find((world) => world.id === worldId);
    }

    getCardsByWorldId(worldId: number): WorldCard[] {
        return this.cardsByWorld()[worldId] ?? [];
    }

    loadCardsByWorldId(worldId: number): void {
        this.apiService.get<WorldCard[]>(`/worlds/${worldId}/cards`).subscribe({
            next: (cards) => {
                this.cardsByWorld.update((current) => ({
                    ...current,
                    [worldId]: cards,
                }));
            },
            error: (error) => {
                console.error(`Erro ao carregar cartas do mundo ${worldId}:`, error);
            },
        });
    }

    createCard(worldId: number, title: string, description: string, cardTypeId: number) {
        const tempCardId = -Date.now();
        const optimisticCard: WorldCard = {
            id: tempCardId,
            worldId,
            title,
            description,
            createdAtLabel: this.formatToday(),
        };

        this.cardsByWorld.update((current) => ({
            ...current,
            [worldId]: [optimisticCard, ...(current[worldId] ?? [])],
        }));

        return this.apiService
            .post<WorldCard>(`/worlds/${worldId}/cards`, { title, description, cardTypeId })
            .pipe(
                tap((card) => {
                    const persistedCard: WorldCard = {
                        ...card,
                        title: card.title?.trim() ? card.title : title,
                        description: card.description?.trim() ? card.description : description,
                        createdAtLabel: card.createdAtLabel ?? this.formatToday(),
                    };

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

    updateCardTitleLocally(worldId: number, cardId: number, title: string): void {
        this.cardsByWorld.update((current) => {
            const cards = current[worldId] ?? [];
            return {
                ...current,
                [worldId]: cards.map((card) =>
                    card.id === cardId
                        ? { ...card, title }
                        : card
                ),
            };
        });
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
}
