export interface CardRelationshipTarget {
    id?: number;
    targetCardId: number;
}

export interface CardRelationship {
    id?: number;
    name: string;
    targets: CardRelationshipTarget[];
}
