import type { AuthenticationState } from '../Types/index.js';
import type DatabaseCtor from 'better-sqlite3';
type SqliteDatabase = InstanceType<typeof DatabaseCtor>;
export type SqliteAuthStateOptions = {
    dbPath: string;
} | {
    database: SqliteDatabase;
};
export declare function useSqliteAuthState(opts: SqliteAuthStateOptions): Promise<{
    state: AuthenticationState;
    saveCreds: () => void;
    close: () => void;
}>;
export {};
//# sourceMappingURL=use-sqlite-auth-state.d.ts.map