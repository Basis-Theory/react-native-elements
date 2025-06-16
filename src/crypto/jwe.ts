import './cryptoSetup';

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { Base64Url } from '../utils/base64Url';

const ENCRYPTION = {
  KEY_TYPE: 'OKP',
  CURVE: 'X25519',
  ALGORITHM: 'ECDH-ES',
  ENCRYPTION_ALGORITHM: 'A256GCM',
} as const;

export class JWE {
  private async performECDH(
    publicKey: Uint8Array
  ): Promise<{ ephemeralPublicKey: Uint8Array; sharedSecret: Uint8Array }> {
    // Generate ephemeral key pair for X25519
    const ephemeralPrivateKey = x25519.utils.randomPrivateKey();
    const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
    // Perform ECDH using X25519
    const sharedSecret = x25519.getSharedSecret(ephemeralPrivateKey, publicKey);

    return {
      ephemeralPublicKey,
      sharedSecret,
    };
  }

  /**
   * Derives encryption key
   * Uses Concat KDF for ECDH-ES
   */
  private deriveKey(sharedSecret: Uint8Array, algorithm: string): Uint8Array {
    const keyLength = 32;
    const algorithmBytes = new TextEncoder().encode(algorithm);
    const algorithmLength = new Uint8Array(4);
    new DataView(algorithmLength.buffer).setUint32(
      0,
      algorithmBytes.length,
      false
    ); // big-endian

    // PartyUInfo and PartyVInfo are empty (length = 0)
    const emptyPartyInfo = new Uint8Array(4); // 4 zero bytes for length = 0

    // SuppPubInfo = key length in bits as 32-bit big-endian integer
    const suppPubInfo = new Uint8Array(4);
    new DataView(suppPubInfo.buffer).setUint32(0, keyLength * 8, false); // key length in bits

    // Concat KDF input: Z || AlgorithmID || PartyUInfo || PartyVInfo || SuppPubInfo
    const kdfInput = new Uint8Array(
      sharedSecret.length +
        algorithmLength.length +
        algorithmBytes.length +
        emptyPartyInfo.length + // PartyUInfo
        emptyPartyInfo.length + // PartyVInfo
        suppPubInfo.length
    );

    let offset = 0;
    kdfInput.set(sharedSecret, offset);
    offset += sharedSecret.length;

    kdfInput.set(algorithmLength, offset);
    offset += algorithmLength.length;

    kdfInput.set(algorithmBytes, offset);
    offset += algorithmBytes.length;

    kdfInput.set(emptyPartyInfo, offset); // PartyUInfo
    offset += emptyPartyInfo.length;

    kdfInput.set(emptyPartyInfo, offset); // PartyVInfo
    offset += emptyPartyInfo.length;

    kdfInput.set(suppPubInfo, offset);

    // Perform Concat KDF using SHA-256
    const derivedKey = new Uint8Array(keyLength);
    let derivedBytes = 0;
    let counter = 1;

    while (derivedBytes < keyLength) {
      // Counter || Z || AlgorithmID || PartyUInfo || PartyVInfo || SuppPubInfo
      const counterBytes = new Uint8Array(4);
      new DataView(counterBytes.buffer).setUint32(0, counter, false); // big-endian

      const hashInput = new Uint8Array(counterBytes.length + kdfInput.length);
      hashInput.set(counterBytes, 0);
      hashInput.set(kdfInput, counterBytes.length);

      const hash = sha256(hashInput);
      const bytesToCopy = Math.min(hash.length, keyLength - derivedBytes);
      derivedKey.set(hash.slice(0, bytesToCopy), derivedBytes);

      derivedBytes += bytesToCopy;
      counter++;
    }

    return derivedKey;
  }

  /**
   * Encrypts data using AES-256-GCM with @noble/ciphers
   */
  private encryptAESGCM(
    plaintext: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
    additionalData: Uint8Array
  ): Uint8Array {
    // Create AES-256-GCM cipher using @noble/ciphers
    const cipher = gcm(key, iv, additionalData);

    // Encrypt - this returns combined ciphertext+tag
    return cipher.encrypt(plaintext);
  }

  /**
   * Creates a JWE using X25519 ECDH-ES key agreement and AES-256-GCM encryption
   */
  public async createJWE(
    payload: string,
    recipientPublicKey: string,
    keyId: string
  ): Promise<string> {
    try {
      // Step 1: Perform ECDH to get shared secret
      const publicKeyBytes = this.decodePublicKey(recipientPublicKey);
      const { ephemeralPublicKey, sharedSecret } =
        await this.performECDH(publicKeyBytes);

      // Step 2: Derive encryption key using Concat KDF
      const derivedKey = this.deriveKey(
        sharedSecret,
        ENCRYPTION.ENCRYPTION_ALGORITHM
      );

      // Step 3: Add ephemeral public key to header using base64url encoding
      const header = {
        alg: ENCRYPTION.ALGORITHM,
        kid: keyId,
        enc: ENCRYPTION.ENCRYPTION_ALGORITHM,
        epk: {
          kty: ENCRYPTION.KEY_TYPE,
          crv: ENCRYPTION.CURVE,
          x: Base64Url.encode(ephemeralPublicKey),
        },
      };
      const protectedHeader = Base64Url.encodeString(JSON.stringify(header));

      // Step 4: Generate random IV (12 bytes for GCM)
      const iv = randomBytes(12);

      // Step 5: Encrypt the payload using AES-256-GCM
      const additionalData = new TextEncoder().encode(protectedHeader);
      const payloadBytes = new TextEncoder().encode(payload);
      const encryptedWithTag = this.encryptAESGCM(
        payloadBytes,
        derivedKey,
        iv,
        additionalData
      );

      // Step 6: Split ciphertext and tag (last 16 bytes)
      const ciphertext = encryptedWithTag.slice(0, -16);
      const tag = encryptedWithTag.slice(-16);

      const ivB64 = Base64Url.encode(iv);
      const ciphertextB64 = Base64Url.encode(ciphertext);
      const tagB64 = Base64Url.encode(tag);

      return `${protectedHeader}..${ivB64}.${ciphertextB64}.${tagB64}`;
    } catch (error) {
      throw new Error(
        `JWE creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper method to decode base64url encoded public key
   */
  public decodePublicKey(base64urlKey: string): Uint8Array {
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
  }
}
