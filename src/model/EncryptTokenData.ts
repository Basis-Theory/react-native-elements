// TODO: Migrate to web-elements when we completely drop basis-theory-js
import {
  CreateToken,
  TokenBase,
} from '@basis-theory/basis-theory-js/types/models';
import { BTRef, InputBTRefWithDatepart } from '../BaseElementTypes';

/**
 * Represents token data with element references for secure input handling.
 * Used when creating tokens that contain form element references instead of raw values.
 */
type TokenDataWithRef = {
  /** Key-value pairs where values are element references or date part references */
  data: Record<string, BTRef | InputBTRefWithDatepart | null | undefined>;
  type: TokenBase['type'];
};

type TokenData = Pick<CreateToken, 'type' | 'data'>;

/**
 * Configuration for encrypting token data using public key encryption.
 * Contains the token requests, public key, and key identifier.
 */
type EncryptToken = {
  /** 
   * Token requests to encrypt - can be a single token or multiple keyed tokens 
   */
  tokenRequests:
    | { [key: string]: TokenDataWithRef }
    | TokenDataWithRef;
  publicKeyPEM: string;
  
  /** Unique identifier for the encryption key obtained from https://developers.basistheory.com/docs/api/client-keys */
  keyId: string;
};

/**
 * Result of token encryption operation.
 * Contains the encrypted token string and its original type.
 */
type EncryptedToken = {
  /** Base64-encoded encrypted token data */
  encrypted: string;

  /** Original token type before encryption */
  type: TokenBase['type'];
};

export { EncryptToken, EncryptedToken, TokenData, TokenDataWithRef };
