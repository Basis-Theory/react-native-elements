/**
 * Base64url encoding/decoding utilities
 * Base64url encoding is different from standard base64:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - Removes padding '=' characters
 */
export const Base64Url = (() => {
  /**
   * Encode a Uint8Array to base64url string
   */
  const encode = (input: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...input));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  /**
   * Decode a base64url string to Uint8Array
   */
  const decode = (input: string): Uint8Array => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    return new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));
  };

  /**
   * Encode a string to base64url
   */
  const encodeString = (input: string): string => {
    const bytes = new TextEncoder().encode(input);
    return encode(bytes);
  };

  /**
   * Decode a base64url string to string
   */
  const decodeString = (input: string): string => {
    const bytes = decode(input);
    return new TextDecoder().decode(bytes);
  };

  return {
    encode,
    decode,
    encodeString,
    decodeString
  };
})(); 