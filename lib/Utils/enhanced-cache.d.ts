export declare const CACHE_CONFIG: {
    MEMORY: { MAX_SIZE: number; TTL: number; STALE_TTL: number };
    SIGNAL: { MAX_SIZE: number; TTL: number };
    GROUPS: { MAX_SIZE: number; TTL: number };
    PROFILES: { MAX_SIZE: number; TTL: number };
    PERSIST_INTERVAL: number;
    PERSIST_ON_SIZE: number;
};

export declare class EnhancedCache<T = any> {
    constructor(name: string, options?: { MAX_SIZE?: number; TTL?: number; STALE_TTL?: number; persistPath?: string });
    get(key: string): T | undefined;
    set(key: string, value: T, ttl?: number): void;
    delete(key: string): void;
    has(key: string): boolean;
    getMany(keys: string[]): { found: Record<string, T>; missing: string[] };
    setMany(entries: Record<string, T>): void;
    load(): Promise<void>;
    getStats(): {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        hitRate: string;
        size: number;
        hotCacheSize: number;
        dirtyKeys: number;
    };
    clear(): void;
    cleanup(): void;
}

export declare class CacheManager {
    constructor(baseDir?: string, logger?: any);
    loadAll(): Promise<void>;
    getCache(name: 'signal' | 'groups' | 'profiles' | 'messages' | 'misc'): EnhancedCache;
    getAllStats(): Record<string, ReturnType<EnhancedCache['getStats']>>;
    clearAll(): void;
    cleanup(): Promise<void>;
}
