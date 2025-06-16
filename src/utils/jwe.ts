import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { Base64Url } from './base64Url';

const ENCRYPTION = {
  KEY_TYPE: 'OKP',
  CURVE: 'X25519',
  ALGORITHM: 'ECDH-ES',
  ENCRYPTION_ALGORITHM: 'A256GCM',
} as const;

export const JWE = (() => {
  const encoder = new TextEncoder();

  const _performECDH = async (
    publicKey: Uint8Array
  ): Promise<{ ephemeralPublicKey: Uint8Array; sharedSecret: Uint8Array }> => {
    // Generate ephemeral key pair for X25519
    const ephemeralPrivateKey = x25519.utils.randomPrivateKey();
    const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
    // Perform ECDH using X25519
    const sharedSecret = x25519.getSharedSecret(ephemeralPrivateKey, publicKey);

    return {
      ephemeralPublicKey,
      sharedSecret,
    };
  };

  /**
   * Derives encryption key
   * Uses Concat KDF for ECDH-ES
   */
  const _deriveKey = (
    sharedSecret: Uint8Array,
    algorithm: string
  ): Uint8Array => {
    const KEY_LENGTH = 32;
    const HASH_LEN = 32;

    const encodeUint32BE = (n: number): Uint8Array =>
      new Uint8Array([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);

    const algorithmBytes = encoder.encode(algorithm);

    const kdfInputParts = [
      sharedSecret,
      encodeUint32BE(algorithmBytes.length),
      algorithmBytes,
      encodeUint32BE(0), // PartyUInfo length
      encodeUint32BE(0), // PartyVInfo length
      encodeUint32BE(KEY_LENGTH * 8), // SuppPubInfo in bits
    ];

    const totalLength = kdfInputParts.reduce(
      (len, part) => len + part.length,
      0
    );
    const kdfInput = new Uint8Array(totalLength);

    let offset = 0;
    for (const part of kdfInputParts) {
      kdfInput.set(part, offset);
      offset += part.length;
    }

    const iterations = Math.ceil(KEY_LENGTH / HASH_LEN);
    const hashChunks = Array.from({ length: iterations }, (_, i) => {
      const counterBytes = encodeUint32BE(i + 1);
      const input = new Uint8Array(counterBytes.length + kdfInput.length);
      input.set(counterBytes);
      input.set(kdfInput, counterBytes.length);
      return sha256(input);
    });

    return Uint8Array.from(hashChunks.flat()).slice(0, KEY_LENGTH);
  };

  /**
   * Encrypts data using AES-256-GCM with @noble/ciphers
   */
  const _encryptAESGCM = (
    plaintext: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
    additionalData: Uint8Array
  ): Uint8Array => {
    // Create AES-256-GCM cipher using @noble/ciphers
    const cipher = gcm(key, iv, additionalData);

    // Encrypt - this returns combined ciphertext+tag
    return cipher.encrypt(plaintext);
  };

  /**
   * Helper method to decode base64url encoded public key
   */
  const decodePublicKey = (base64urlKey: string): Uint8Array => {
    // Handle PEM format
    if (base64urlKey.includes('-----BEGIN')) {
      const base64Content = base64urlKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s/g, '');
      const decoded = atob(base64Content);
      return new Uint8Array(
        decoded.split('').map((char) => char.charCodeAt(0))
      );
    }

    return Base64Url.decode(base64urlKey);
  };

  /**
   * Creates a JWE using X25519 ECDH-ES key agreement and AES-256-GCM encryption
   */
  const createJWE = async (
    payload: string,
    recipientPublicKey: string,
    keyId: string
  ): Promise<string> => {
    try {
      const { ephemeralPublicKey, sharedSecret } = await _performECDH(
        decodePublicKey(recipientPublicKey)
      );

      const derivedKey = _deriveKey(
        sharedSecret,
        ENCRYPTION.ENCRYPTION_ALGORITHM
      );

      const protectedHeader = Base64Url.encodeString(
        JSON.stringify({
          alg: ENCRYPTION.ALGORITHM,
          kid: keyId,
          enc: ENCRYPTION.ENCRYPTION_ALGORITHM,
          epk: {
            kty: ENCRYPTION.KEY_TYPE,
            crv: ENCRYPTION.CURVE,
            x: Base64Url.encode(ephemeralPublicKey),
          },
        })
      );

      const iv = randomBytes(12);
      const additionalData = encoder.encode(protectedHeader);
      const payloadBytes = encoder.encode(payload);
      const encrypted = _encryptAESGCM(
        payloadBytes,
        derivedKey,
        iv,
        additionalData
      );

      const [ciphertext, tag] = [encrypted.slice(0, -16), encrypted.slice(-16)];

      return `${protectedHeader}..${Base64Url.encode(iv)}.${Base64Url.encode(ciphertext)}.${Base64Url.encode(tag)}`;
    } catch (error) {
      throw new Error(
        `JWE creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Return public methods
  return {
    createJWE,
    decodePublicKey,
  };
})();
