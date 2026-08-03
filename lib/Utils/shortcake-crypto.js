import { randomBytes } from 'crypto';
import { proto } from '../../WAProto/index.js';
import { aesEncryptGCM, Curve, hkdf, sha256 } from './crypto.js';
import { bytesToCrockford } from './generics.js';
const NONCE_BYTES = 32;
const VERIFICATION_CODE_BYTES = 5;
const GCM_IV_BYTES = 12;
const ENCRYPTION_KEY_BYTES = 32;
const EPHEMERAL_PUBLIC_KEY_BYTES = 32;
const ENCRYPTION_KEY_INFO = 'Pairing Information Encryption Key';
export function generateCompanionEphemeralIdentity(args) {
    const keyPair = Curve.generateKeyPair();
    const companionNonce = randomBytes(NONCE_BYTES);
    const companionEphemeralIdentityBytes = proto.CompanionEphemeralIdentity.encode({
        publicKey: keyPair.public,
        deviceType: args.deviceType,
        ref: args.ref
    }).finish();
    const commitmentHash = sha256(Buffer.concat([companionEphemeralIdentityBytes, companionNonce]));
    const prologuePayloadBytes = proto.ProloguePayload.encode({
        companionEphemeralIdentity: companionEphemeralIdentityBytes,
        commitment: { hash: commitmentHash }
    }).finish();
    return {
        keyPair,
        companionNonce,
        companionEphemeralIdentityBytes,
        commitmentHash,
        prologuePayloadBytes
    };
}
export function decodePrimaryEphemeralIdentity(bytes) {
    const decoded = proto.PrimaryEphemeralIdentity.decode(bytes);
    const publicKey = decoded.publicKey;
    const nonce = decoded.nonce;
    if (!publicKey || publicKey.length !== EPHEMERAL_PUBLIC_KEY_BYTES) {
        throw new Error('shortcake: PrimaryEphemeralIdentity.publicKey must be 32 bytes');
    }
    if (!nonce || nonce.length !== NONCE_BYTES) {
        throw new Error('shortcake: PrimaryEphemeralIdentity.nonce must be 32 bytes');
    }
    return { publicKey, nonce };
}
export function deriveVerificationCode(companionNonce, primary) {
    const digest = sha256(Buffer.concat([companionNonce, primary.publicKey]));
    const code = Buffer.alloc(VERIFICATION_CODE_BYTES);
    for (let i = 0; i < VERIFICATION_CODE_BYTES; i += 1) {
        code[i] = primary.nonce[i] ^ digest[i];
    }
    return bytesToCrockford(code);
}
export function deriveEncryptionKey(args) {
    const shared = Curve.sharedKey(args.companionPrivKey, args.primaryPublicKey);
    const salt = Buffer.from(`Companion Pairing ${String(args.deviceType)} with ref ${args.ref}`);
    return hkdf(shared, ENCRYPTION_KEY_BYTES, { salt, info: ENCRYPTION_KEY_INFO });
}
export function encryptPairingRequest(encryptionKey, plaintext) {
    if (encryptionKey.length !== ENCRYPTION_KEY_BYTES) {
        throw new Error('shortcake: encryption key must be 32 bytes');
    }
    const iv = randomBytes(GCM_IV_BYTES);
    const encryptedPayload = aesEncryptGCM(plaintext, encryptionKey, iv, Buffer.alloc(0));
    return proto.EncryptedPairingRequest.encode({ encryptedPayload, iv }).finish();
}
//# sourceMappingURL=shortcake-crypto.js.map