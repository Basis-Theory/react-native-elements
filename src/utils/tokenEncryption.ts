import { importJWK, CompactEncrypt, JWK } from 'jose';

const ENCRYPTION = {
  KEY_TYPE: 'OKP',
  CURVE: 'X25519',
  ALGORITHM: 'ECDH-ES',
  ENCRYPTION_ALGORITHM: 'A256GCM'
};

export class TokenEncryption {
  private readonly publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async encrypt(payload: string): Promise<string> {
    const jwk: JWK = {
      kty: ENCRYPTION.KEY_TYPE,
      crv: ENCRYPTION.CURVE,
      x: this.publicKey
    };

    const key = await importJWK(jwk, ENCRYPTION.ALGORITHM);
    
    return new CompactEncrypt(
      new TextEncoder().encode(payload)
    )
      .setProtectedHeader({ alg: ENCRYPTION.ALGORITHM, enc: ENCRYPTION.ENCRYPTION_ALGORITHM })
      .encrypt(key);
  }
}

// Example usage
async function main(): Promise<void> {
  const rawPublicKey = "uIXXIyiF537fwvxEcPwFiSYgtD7y3p2KswRAqrwkPjI=";
  const encryptor = new TokenEncryption(rawPublicKey);
  
  const jwe = await encryptor.encrypt("Encrypted Text!");
  console.log(jwe);
}

main().catch(console.error); 