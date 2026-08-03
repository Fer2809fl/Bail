export declare class ObjectRepository<T> {
    protected entityMap: Map<string, T>;
    constructor(entities?: {
        [id: string]: T;
    });
    findById(id: string): T | undefined;
    findAll(): T[];
    upsertById(id: string, entity: T): Map<string, T>;
    deleteById(id: string): boolean;
    count(): number;
    toJSON(): T[];
}
//# sourceMappingURL=object-repository.d.ts.map