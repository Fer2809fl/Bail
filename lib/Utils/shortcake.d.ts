import { proto } from '../../WAProto/index.js';
import type { AuthenticationCreds } from '../Types/index.js';
import { type BinaryNode } from '../WABinary/index.js';
import type { ILogger } from './logger.js';
export type ShortcakeAssertionSigner = (requestOptions: Uint8Array) => Promise<{
    readonly credentialId: Uint8Array;
    readonly webauthnAssertion: Uint8Array;
}>;
export interface ShortcakeFlowOptions {
    readonly logger: ILogger;
    readonly query: (node: BinaryNode, timeoutMs?: number) => Promise<BinaryNode>;
    readonly signAssertion: ShortcakeAssertionSigner;
    readonly getCreds: () => AuthenticationCreds;
    readonly updateCreds: (patch: Partial<AuthenticationCreds>) => void;
    readonly deviceType?: proto.DeviceProps.PlatformType;
    readonly emitVerificationCode?: (code: string) => void;
    readonly emitPrologueSent?: () => void;
}
export declare const makeShortcakeFlow: (opts: ShortcakeFlowOptions) => {
    handleIncomingNotification: (node: BinaryNode) => Promise<boolean>;
    executePrologue: (args?: {
        readonly requestOptions?: Uint8Array;
        readonly pairingHandoffProof?: Uint8Array;
    }) => Promise<void>;
    confirmVerificationCode: () => Promise<void>;
    hasSession: () => boolean;
    getVerificationCode: () => string | null;
    clearSession: () => void;
};
export type ShortcakeFlow = ReturnType<typeof makeShortcakeFlow>;
//# sourceMappingURL=shortcake.d.ts.map