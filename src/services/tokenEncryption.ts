// This MUST be imported before any @noble libraries

import 'react-native-get-random-values';
import { install } from 'react-native-quick-crypto';

import {
  EncryptedToken,
  EncryptToken,
  TokenData,
  TokenDataWithRef,
} from '../model/EncryptTokenData';
import { replaceElementRefs } from '../utils/dataManipulationUtils';
import { JWE } from '../utils/jwe';

export class EncryptValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'EncryptValidationError';
  }
}

export const setupEncryption = () => {
  install();

  if (!globalThis.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { webcrypto } = require('react-native-quick-crypto');
    if (webcrypto) {
      globalThis.crypto = webcrypto;
    } else {
      throw new Error('Failed to setup crypto polyfill for React Native');
    }
  }

  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      'crypto.getRandomValues is not available after polyfill setup'
    );
  }
};

/**
 * Creates a JSON Web Encryption (JWE) object for the given payload using ReactNativeCrypto
 * @param payload - The string payload to encrypt
 * @param publicKeyBase64url - The base64url encoded X25519 public key
 * @param keyId - The key ID for the JWE header
 * @returns Promise resolving to the encrypted JWE string
 * @throws {Error} When encryption fails or parameters are invalid
 */
const createJWE = async (
  payload: string,
  publicKeyBase64url: string,
  keyId: string
): Promise<string> => {
  try {
    return await JWE.createJWE(payload, publicKeyBase64url, keyId);
  } catch (error) {
    throw new Error(
      `Failed to create JWE: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

/**
 * Normalizes token requests to a consistent array format
 * @param tokenRequests - Token requests in either single token or object format
 * @returns Array of normalized token objects
 */
const normalizeTokenRequests = (
  tokenRequests: EncryptToken['tokenRequests']
): Array<TokenDataWithRef> => {
  if ('type' in tokenRequests) {
    return [tokenRequests as TokenDataWithRef];
  }

  return Object.values(tokenRequests);
};

/**
 * Encrypts token data using JSON Web Encryption (JWE) with ReactNativeCrypto
 * @param payload - The encryption payload containing token requests, public key, and key ID
 * @returns Promise resolving to an array of encrypted tokens
 * @throws {Error} When encryption fails or payload is invalid
 */
export const encryptToken = async (
  payload: EncryptToken
): Promise<EncryptedToken[]> => {
  if (!payload) {
    throw new EncryptValidationError('Encryption payload is required');
  }

  if (!payload.publicKeyPEM) {
    throw new EncryptValidationError('Public key PEM is required');
  }

  if (!payload.keyId) {
    throw new EncryptValidationError('Key ID is required');
  }

  if (!payload.tokenRequests) {
    throw new EncryptValidationError('Token requests are required');
  }

  try {
    const tokensWithRef: TokenDataWithRef[] = normalizeTokenRequests(
      payload.tokenRequests
    );
    if (!tokensWithRef.length) {
      throw new EncryptValidationError('No valid tokens found to encrypt');
    }

    const tokens: TokenData[] = tokensWithRef.map((token) =>
      replaceElementRefs<TokenData>(token)
    );

    return await Promise.all(
      tokens.map(async (token) => {
        if (!token.type) {
          throw new EncryptValidationError('Token type is required');
        }

        const tokenPayload = JSON.stringify(token.data);
        const encrypted = await createJWE(
          tokenPayload,
          payload.publicKeyPEM,
          payload.keyId
        );
        return {
          encrypted,
          type: token.type,
        };
      })
    );
  } catch (error) {
    if (error instanceof EncryptValidationError) {
      throw error;
    }
    throw new Error(`Failed to encrypt tokens: ${String(error)}`);
  }
};
