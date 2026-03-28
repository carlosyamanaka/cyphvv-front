import { Injectable, signal, inject, computed } from '@angular/core';
import { catchError, tap } from 'rxjs';
import { World } from '../models/world.model';
import { WorldCard } from '../models/world-card.model';
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

    createCard(worldId: number, title: string, description: string) {
        return this.apiService
            .post<WorldCard>(`/worlds/${worldId}/cards`, { title, description })
            .pipe(
                tap((card) => {
                    this.cardsByWorld.update((current) => ({
                        ...current,
                        [worldId]: [card, ...(current[worldId] ?? [])],
                    }));
                }),
                catchError((error) => {
                    console.error('Erro ao criar carta:', error);
                    this.error.set('Erro ao criar carta. Por favor, tente novamente.');
                    throw error;
                })
            );
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
