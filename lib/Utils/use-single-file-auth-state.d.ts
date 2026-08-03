import type { AuthenticationState } from '../Types/index.js';
export declare const useSingleFileAuthState: (fileName: string) => Promise<{
    state: AuthenticationState;
    saveCreds: () => void;
}>;
//# sourceMappingURL=use-single-file-auth-state.d.ts.map