export const CARD_BRANDS = [
  'accel',
  'bancontact',
  'cartes-bancaires',
  'culiance',
  'dankort',
  'ebt',
  'eftpos-australia',
  'nyce',
  'private-label',
  'prop',
  'pulse',
  'rupay',
  'star',
  'uatp',
  'korean-local',
  'visa',
  'mastercard',
  'american-express',
  'discover',
  'diners-club',
  'jcb',
  'unionpay',
  'maestro',
  'elo',
  'hiper',
  'hipercard',
  'mir',
  'unknown',
] as const;

export type CardBrand = (typeof CARD_BRANDS)[number];

export enum CoBadgedSupport {
  CartesBancaires = 'cartes-bancaires',
}

interface BinRange {
  binMin: string;
  binMax: string;
}
interface CardIssuerDetails {
  country: string;
  name: string;
}
interface CardInfo {
  brand: string;
  funding: string;
  issuer: CardIssuerDetails;
  binRange?: BinRange[];
}
export interface BinInfo {
  brand?: string;
  funding?: string;
  issuer?: CardIssuerDetails;
  segment?: string;
  additional?: CardInfo[];
  binRange?: BinRange[];
}
  