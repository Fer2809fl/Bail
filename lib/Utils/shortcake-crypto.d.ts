import { proto } from '../../WAProto/index.js';
import type { KeyPair } from '../Types/index.js';
export interface ShortcakePrimaryEphemeralIdentity {
    readonly publicKey: Uint8Array;
    readonly nonce: Uint8Array;
}
export interface ShortcakeCompanionEphemeralIdentity {
    readonly keyPair: KeyPair;
    readonly companionNonce: Uint8Array;
    readonly companionEphemeralIdentityBytes: Uint8Array;
    readonly commitmentHash: Uint8Array;
    readonly prologuePayloadBytes: Uint8Array;
}
export declare function generateCompanionEphemeralIdentity(args: {
    readonly ref: string;
    readonly deviceType: proto.DeviceProps.PlatformType;
}): ShortcakeCompanionEphemeralIdentity;
export declare function decodePrimaryEphemeralIdentity(bytes: Uint8Array): ShortcakePrimaryEphemeralIdentity;
export declare function deriveVerificationCode(companionNonce: Uint8Array, primary: ShortcakePrimaryEphemeralIdentity): string;
export declare function deriveEncryptionKey(args: {
    readonly companionPrivKey: Uint8Array;
    readonly primaryPublicKey: Uint8Array;
    readonly deviceType: proto.DeviceProps.PlatformType;
    readonly ref: string;
}): Uint8Array;
export declare function encryptPairingRequest(encryptionKey: Uint8Array, plaintext: Uint8Array): Uint8Array;
//# sourceMappingURL=shortcake-crypto.d.ts.map