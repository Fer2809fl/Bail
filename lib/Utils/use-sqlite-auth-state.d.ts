import type { AuthenticationState } from "../Types/index.js";

export declare function useSqliteAuthState(opts: {
    dbPath?: string;
    database?: any;
}): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
    clearKeys: () => Promise<void>;
    close: () => void;
}>;
