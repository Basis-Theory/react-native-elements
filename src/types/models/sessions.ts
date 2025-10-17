export interface CreateSessionResponse {
  nonce: string;
  expiresAt: string;
  sessionKey: string;
  _debug?: {
    cfRay?: string;
    btTraceId?: string;
  };
}
