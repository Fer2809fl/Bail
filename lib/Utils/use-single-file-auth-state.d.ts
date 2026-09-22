import type { AuthenticationState } from '../Types/index.js';
/**
 * Guarda toda la sesión (creds + keys) en un único archivo JSON en vez de
 * un archivo por key. Útil cuando el hosting sufre con muchos archivos de
 * sesión por subbot.
 * */
export declare const useSingleFileAuthState: (filePath: string) => Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
//# sourceMappingURL=use-single-file-auth-state.d.ts.map
