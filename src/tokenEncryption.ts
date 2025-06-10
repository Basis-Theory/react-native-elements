import { CompactEncrypt, importJWK, JWK, KeyLike } from 'jose';
import { EncryptedToken, EncryptToken, TokenData, TokenDataWithRef } from './model/EncryptTokenData';
import { replaceElementRefs } from './utils/dataManipulationUtils';

const ENCRYPTION = {
  KEY_TYPE: 'OKP',
  CURVE: 'X25519',
  ALGORITHM: 'ECDH-ES',
  ENCRYPTION_ALGORITHM: 'A256GCM'
} as const;

export class EncryptValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'EncryptValidationError';
  }
}

/**
 * Creates a JSON Web Encryption (JWE) object for the given payload
 * @param payload - The string payload to encrypt
 * @param jwk - The JSON Web Key containing key metadata
 * @param key - The cryptographic key for encryption
 * @returns Promise resolving to the encrypted JWE string
 * @throws {Error} When encryption fails or parameters are invalid
 */
const createJWE = async (
  payload: string,
  jwk: JWK,
  key: KeyLike | Uint8Array
): Promise<string> => {
  try {
    return new CompactEncrypt(
      new TextEncoder().encode(payload)
    )
      .setProtectedHeader({ alg: ENCRYPTION.ALGORITHM, enc: ENCRYPTION.ENCRYPTION_ALGORITHM, kid: jwk.kid })
      .encrypt(key);
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

const removePEMFormat = (publicKeyPEM: string) =>
  publicKeyPEM
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/[\n\r]/gu, '')
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]+$/gu, '');

/**
 * Encrypts token data using JSON Web Encryption (JWE)
 * @param payload - The encryption payload containing token requests, public key, and key ID
 * @returns Promise resolving to an array of encrypted tokens
 * @throws {Error} When encryption fails or payload is invalid
 */
// TODO: To avoid duplication, add this to web-elements when we completely drop basis-theory-js
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

    const jwk: JWK = {
      kty: ENCRYPTION.KEY_TYPE,
      crv: ENCRYPTION.CURVE,
      x: removePEMFormat(payload.publicKeyPEM),
      kid: payload.keyId
    };

    const key = await importJWK(jwk, ENCRYPTION.ALGORITHM);

    const tokensWithRef: TokenDataWithRef[] = normalizeTokenRequests(payload.tokenRequests);
    if (!tokensWithRef.length) {
      throw new EncryptValidationError('No valid tokens found to encrypt');
    }

    const tokens: TokenData[] = tokensWithRef.map(token => replaceElementRefs<TokenData>(token));

    return await Promise.all(
      tokens.map(async (token) => {
        if (!token.type) {
          throw new EncryptValidationError('Token type is required');
        }

        const tokenPayload = JSON.stringify(token);
        const encrypted = await createJWE(tokenPayload, jwk, key);

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
