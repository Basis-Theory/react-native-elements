import { importJWK, CompactEncrypt, JWK } from 'jose';

const ENCRYPTION = {
  KEY_TYPE: 'OKP',
  CURVE: 'X25519',
  ALGORITHM: 'ECDH-ES',
  ENCRYPTION_ALGORITHM: 'A256GCM'
} as const;

export class TokenEncryption {
  private readonly publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async encrypt(payload: string): Promise<string> {
    const jwk: JWK = {
      kty: ENCRYPTION.KEY_TYPE,
      crv: ENCRYPTION.CURVE,
      x: this.publicKey,
      kid: "db40a40a-9097-45ff-b353-0488a6a4d193"
    };

    const key = await importJWK(jwk, ENCRYPTION.ALGORITHM);

    return new CompactEncrypt(
      new TextEncoder().encode(payload)
    )
      .setProtectedHeader({ alg: ENCRYPTION.ALGORITHM, enc: ENCRYPTION.ENCRYPTION_ALGORITHM, kid: jwk.kid })
      .encrypt(key);
  }
}

// Example usage
async function main(): Promise<void> {
  const rawPublicKey = "TUUclxBySPBHt8YLB6SqXSAjXWB2dy4NoAQpt833GAw=";
  const encryptor = new TokenEncryption(rawPublicKey);

  const jwe = await encryptor.encrypt(JSON.stringify(
    {
      "number": "4200000000000000",
      "expiration_month": 12,
      "expiration_year": 2025,
      "cvc": "123"
    }
  ));
  console.log(jwe);
}

main().catch(console.error);
