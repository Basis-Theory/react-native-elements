import { JWE } from '../../src/utils/jwe';
import { Base64Url } from '../../src/utils/base64Url';

// Mock the noble crypto libraries
jest.mock('@noble/ciphers/aes', () => ({
  gcm: jest.fn(),
}));

jest.mock('@noble/ciphers/webcrypto', () => ({
  randomBytes: jest.fn(),
}));

jest.mock('@noble/curves/ed25519', () => ({
  x25519: {
    utils: {
      randomPrivateKey: jest.fn(),
    },
    getPublicKey: jest.fn(),
    getSharedSecret: jest.fn(),
  },
}));

jest.mock('@noble/hashes/sha2', () => ({
  sha256: jest.fn(),
}));

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';

describe('JWE Module', () => {
  const mockPayload = 'test-payload';
  const mockKeyId = 'test-key-id';
  const mockPublicKeyPEM = '-----BEGIN PUBLIC KEY-----\nVGVzdEtleURhdGE=\n-----END PUBLIC KEY-----';
  const mockPublicKeyBase64url = 'VGVzdEtleURhdGE';

  // Mock crypto data
  const mockPrivateKey = new Uint8Array([1, 2, 3, 4]);
  const mockEphemeralPublicKey = new Uint8Array([5, 6, 7, 8]);
  const mockSharedSecret = new Uint8Array(32).fill(1);
  const mockIv = new Uint8Array(12).fill(2);
  const mockCiphertext = new Uint8Array([9, 10, 11, 12]);
  const mockTag = new Uint8Array(16).fill(3);
  const mockEncryptedWithTag = new Uint8Array([...mockCiphertext, ...mockTag]);
  const mockHash = new Uint8Array(32).fill(4);

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (x25519.utils.randomPrivateKey as jest.Mock).mockReturnValue(mockPrivateKey);
    (x25519.getPublicKey as jest.Mock).mockReturnValue(mockEphemeralPublicKey);
    (x25519.getSharedSecret as jest.Mock).mockReturnValue(mockSharedSecret);
    (randomBytes as jest.Mock).mockReturnValue(mockIv);
    (sha256 as unknown as jest.Mock).mockReturnValue(mockHash);

    const mockCipher = {
      encrypt: jest.fn().mockReturnValue(mockEncryptedWithTag),
    };
    (gcm as unknown as jest.Mock).mockReturnValue(mockCipher);
  });

  describe('createJWE', () => {
    it('should create a valid JWE with PEM public key', async () => {
      const result = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);

      // Verify JWE structure (5 parts separated by dots)
      const parts = result.split('.');
      expect(parts).toHaveLength(5);
      expect(parts[1]).toBe(''); // Empty encrypted key for ECDH-ES

      // Verify header is properly encoded
      const headerJson = JSON.parse(Base64Url.decodeString(parts[0]));
      expect(headerJson).toEqual({
        alg: 'ECDH-ES',
        kid: mockKeyId,
        enc: 'A256GCM',
        epk: {
          kty: 'OKP',
          crv: 'X25519',
          x: Base64Url.encode(mockEphemeralPublicKey),
        },
      });

      // Verify crypto operations were called
      expect(x25519.utils.randomPrivateKey).toHaveBeenCalled();
      expect(x25519.getPublicKey).toHaveBeenCalledWith(mockPrivateKey);
      expect(x25519.getSharedSecret).toHaveBeenCalledWith(mockPrivateKey, expect.any(Uint8Array));
      expect(randomBytes).toHaveBeenCalledWith(12);
      expect(gcm).toHaveBeenCalled();
    });

    it('should create a valid JWE with base64url public key', async () => {
      const result = await JWE.createJWE(mockPayload, mockPublicKeyBase64url, mockKeyId);

      expect(result).toBeDefined();
      const parts = result.split('.');
      expect(parts).toHaveLength(5);
    });

    it('should handle empty payload', async () => {
      const result = await JWE.createJWE('', mockPublicKeyPEM, mockKeyId);

      expect(result).toBeDefined();
      const parts = result.split('.');
      expect(parts).toHaveLength(5);
    });

    it('should handle JSON payload', async () => {
      const jsonPayload = JSON.stringify({ user: 'test', data: [1, 2, 3] });
      const result = await JWE.createJWE(jsonPayload, mockPublicKeyPEM, mockKeyId);

      expect(result).toBeDefined();
      const parts = result.split('.');
      expect(parts).toHaveLength(5);
    });

    it('should generate different ephemeral keys for each call', async () => {
      const mockPrivateKey2 = new Uint8Array([10, 11, 12, 13]);
      const mockEphemeralPublicKey2 = new Uint8Array([14, 15, 16, 17]);

      (x25519.utils.randomPrivateKey as jest.Mock)
        .mockReturnValueOnce(mockPrivateKey)
        .mockReturnValueOnce(mockPrivateKey2);
      
      (x25519.getPublicKey as jest.Mock)
        .mockReturnValueOnce(mockEphemeralPublicKey)
        .mockReturnValueOnce(mockEphemeralPublicKey2);

      const result1 = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);
      const result2 = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);

      expect(result1).not.toBe(result2);

      const header1 = JSON.parse(Base64Url.decodeString(result1.split('.')[0]));
      const header2 = JSON.parse(Base64Url.decodeString(result2.split('.')[0]));

      expect(header1.epk.x).not.toBe(header2.epk.x);
    });

    it('should generate different IVs for each call', async () => {
      const mockIv2 = new Uint8Array(12).fill(5);

      (randomBytes as jest.Mock)
        .mockReturnValueOnce(mockIv)
        .mockReturnValueOnce(mockIv2);

      const result1 = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);
      const result2 = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);

      expect(result1).not.toBe(result2);

      const iv1 = result1.split('.')[2];
      const iv2 = result2.split('.')[2];

      expect(iv1).not.toBe(iv2);
    });

    it('should throw error when X25519 key generation fails', async () => {
      (x25519.utils.randomPrivateKey as jest.Mock).mockImplementation(() => {
        throw new Error('Key generation failed');
      });

      await expect(JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId))
        .rejects.toThrow('JWE creation failed: Key generation failed');
    });

    it('should throw error when encryption fails', async () => {
      const mockCipher = {
        encrypt: jest.fn().mockImplementation(() => {
          throw new Error('Encryption failed');
        }),
      };
      (gcm as unknown as jest.Mock).mockReturnValue(mockCipher);

      await expect(JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId))
        .rejects.toThrow('JWE creation failed: Encryption failed');
    });

    it('should derive key using correct algorithm', async () => {
      await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);

      // Verify sha256 was called for key derivation
      expect(sha256).toHaveBeenCalled();
      
      // Check that the key derivation uses the correct algorithm
      const sha256Calls = (sha256 as unknown as jest.Mock).mock.calls;
      expect(sha256Calls.length).toBeGreaterThan(0);
    });

    it('should handle large payloads', async () => {
      const largePayload = 'x'.repeat(10000);
      const result = await JWE.createJWE(largePayload, mockPublicKeyPEM, mockKeyId);

      expect(result).toBeDefined();
      const parts = result.split('.');
      expect(parts).toHaveLength(5);
    });

    it('should produce base64url encoded components', async () => {
      const result = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);
      const [header, encryptedKey, iv, ciphertext, tag] = result.split('.');

      // All parts should be valid base64url (no +, /, or = characters)
      expect(header).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(iv).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(tag).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(encryptedKey).toBe(''); // Should be empty for ECDH-ES
    });
  });

  describe('decodePublicKey', () => {
    it('should decode PEM format public key', () => {
      const result = JWE.decodePublicKey(mockPublicKeyPEM);

      expect(result).toBeInstanceOf(Uint8Array);
      // Verify it extracted the base64 content from PEM
      expect(result).toEqual(new Uint8Array([84, 101, 115, 116, 75, 101, 121, 68, 97, 116, 97]));
    });

    it('should decode base64url format public key', () => {
      const result = JWE.decodePublicKey(mockPublicKeyBase64url);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(Base64Url.decode(mockPublicKeyBase64url));
    });

    it('should handle PEM with different line endings', () => {
      const pemWithCRLF = '-----BEGIN PUBLIC KEY-----\r\nVGVzdEtleURhdGE=\r\n-----END PUBLIC KEY-----';
      const result = JWE.decodePublicKey(pemWithCRLF);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([84, 101, 115, 116, 75, 101, 121, 68, 97, 116, 97]));
    });

    it('should handle PEM with extra whitespace', () => {
      const pemWithSpaces = `-----BEGIN PUBLIC KEY-----
      VGVzdEtleURhdGE=
      -----END PUBLIC KEY-----`;
      const result = JWE.decodePublicKey(pemWithSpaces);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([84, 101, 115, 116, 75, 101, 121, 68, 97, 116, 97]));
    });

    it('should handle different PEM key types', () => {
      const rsaPem = '-----BEGIN RSA PUBLIC KEY-----\nVGVzdEtleURhdGE=\n-----END RSA PUBLIC KEY-----';
      const result = JWE.decodePublicKey(rsaPem);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([84, 101, 115, 116, 75, 101, 121, 68, 97, 116, 97]));
    });

    it('should handle empty PEM content', () => {
      const emptyPem = '-----BEGIN PUBLIC KEY-----\n-----END PUBLIC KEY-----';
      const result = JWE.decodePublicKey(emptyPem);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(0);
    });

    it('should handle base64url with URL-safe characters', () => {
      const base64urlWithSpecialChars = 'VGVzdF9LZXktRGF0YQ'; // Contains _ and -
      const result = JWE.decodePublicKey(base64urlWithSpecialChars);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(Base64Url.decode(base64urlWithSpecialChars));
    });
  });

  describe('Key Derivation Logic', () => {
    it('should perform correct Concat KDF steps', async () => {
      await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);

      // Verify SHA-256 is called for key derivation
      expect(sha256).toHaveBeenCalled();
      
      // Should call sha256 once for a 32-byte key (single iteration)
      expect(sha256).toHaveBeenCalledTimes(1);
      
      const sha256Call = (sha256 as unknown as jest.Mock).mock.calls[0][0];
      expect(sha256Call).toBeInstanceOf(Uint8Array);
      
      // The input should contain the counter (4 bytes) + KDF input
      expect(sha256Call.length).toBeGreaterThan(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid base64url in public key', () => {
      const invalidBase64url = 'invalid!!base64url++';
      
      expect(() => JWE.decodePublicKey(invalidBase64url)).toThrow();
    });

    it('should handle malformed PEM', () => {
      const malformedPem = '-----BEGIN PUBLIC KEY-----\ninvalid!!content++\n-----END PUBLIC KEY-----';
      
      expect(() => JWE.decodePublicKey(malformedPem)).toThrow();
    });

    it('should propagate crypto library errors', async () => {
      (x25519.getSharedSecret as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid public key');
      });

      await expect(JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId))
        .rejects.toThrow('JWE creation failed: Invalid public key');
    });
  });

  describe('JWE Structure', () => {
    it('should create valid JWE structure end-to-end', async () => {
      const result = await JWE.createJWE(mockPayload, mockPublicKeyPEM, mockKeyId);
      
      // Verify complete JWE structure
      const [header, encryptedKey, iv, ciphertext, tag] = result.split('.');
      
      // Parse and verify header
      const headerObj = JSON.parse(Base64Url.decodeString(header));
      expect(headerObj.alg).toBe('ECDH-ES');
      expect(headerObj.enc).toBe('A256GCM');
      expect(headerObj.kid).toBe(mockKeyId);
      expect(headerObj.epk.kty).toBe('OKP');
      expect(headerObj.epk.crv).toBe('X25519');
      expect(headerObj.epk.x).toBeDefined();
      
      // Verify structure
      expect(encryptedKey).toBe(''); // ECDH-ES uses empty encrypted key
      expect(iv).toBeTruthy();
      expect(ciphertext).toBeTruthy();
      expect(tag).toBeTruthy();
      
      // Verify all components are base64url encoded
      expect(() => Base64Url.decode(iv)).not.toThrow();
      expect(() => Base64Url.decode(ciphertext)).not.toThrow();
      expect(() => Base64Url.decode(tag)).not.toThrow();
    });
  });
}); 