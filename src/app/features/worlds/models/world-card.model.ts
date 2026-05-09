export interface CardSection {
    id?: number;
    type: string;
    content: string;
}

export interface WorldCard {
    id: number;
    worldId: number;
    cardTypeId: number;
    cardName: string;
    sections?: CardSection[];
    createdAtLabel: string;
    aliases?: string[];
    imageUrl?: string;
}
