import { EncryptedToken, EncryptToken, TokenData, TokenDataWithRef } from './model/EncryptTokenData';
import { replaceElementRefs } from './utils/dataManipulationUtils';
import { ReactNativeCrypto } from './crypto/reactNativeCrypto';

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
    const crypto = ReactNativeCrypto.getInstance();

    // Decode the public key from base64url
    const publicKeyBytes = crypto.decodePublicKey(publicKeyBase64url);

    // Create JWE header
    const header = {
      alg: ENCRYPTION.ALGORITHM,
      enc: ENCRYPTION.ENCRYPTION_ALGORITHM,
      kid: keyId
    };

    // Convert payload to bytes
    const payloadBytes = new TextEncoder().encode(payload);

    // Create JWE
    return await crypto.createJWE(payloadBytes, publicKeyBytes, header);
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

        const tokenPayload = JSON.stringify(token.data);
        const encrypted = await createJWE(tokenPayload, payload.publicKeyPEM, payload.keyId);
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
