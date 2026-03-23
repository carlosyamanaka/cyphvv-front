import { Injectable, signal } from '@angular/core';
import { World } from '../models/world.model';
import { WorldCard } from '../models/world-card.model';

@Injectable({
    providedIn: 'root',
})
export class WorldsStore {
    private nextWorldId = 4;
    private nextCardId = 1;

    readonly worlds = signal<World[]>([
        {
            id: 1,
            name: 'Eryndor',
            summary: 'Continente ancestral com cidades suspensas e ordem arcana.',
            createdAtLabel: this.formatToday(),
        },
        {
            id: 2,
            name: 'Drakmor',
            summary: 'Territorio gelido dividido por faccoes e feras miticas.',
            createdAtLabel: this.formatToday(),
        },
        {
            id: 3,
            name: 'Solthera',
            summary: 'Reino solar com grandes disputas politicas e tecnomagia.',
            createdAtLabel: this.formatToday(),
        },
    ]);

    readonly cardsByWorld = signal<Record<number, WorldCard[]>>({});

    createWorld(name: string): World {
        const world = {
            id: this.nextWorldId,
            name,
            summary: 'Novo mundo criado. Defina geografia, faccoes e trama principal.',
            createdAtLabel: this.formatToday(),
        } satisfies World;

        this.nextWorldId += 1;
        this.worlds.update((currentWorlds) => [world, ...currentWorlds]);
        return world;
    }

    getWorldById(worldId: number): World | undefined {
        return this.worlds().find((world) => world.id === worldId);
    }

    getCardsByWorldId(worldId: number): WorldCard[] {
        return this.cardsByWorld()[worldId] ?? [];
    }

    createCard(worldId: number, title: string, description: string): WorldCard {
        const card = {
            id: this.nextCardId,
            worldId,
            title,
            description,
            createdAtLabel: this.formatToday(),
        } satisfies WorldCard;

        this.nextCardId += 1;

        this.cardsByWorld.update((currentCardsByWorld) => ({
            ...currentCardsByWorld,
            [worldId]: [card, ...(currentCardsByWorld[worldId] ?? [])],
        }));

        return card;
    }

    private formatToday(): string {
        return new Date().toLocaleDateString('pt-BR');
    }
}
