import { useEffect, useRef, useState, useMemo } from 'react';
import {
  _useConfigManager,
} from '../BasisTheoryProvider';
import type { BinInfo, BinRange } from '../CardElementTypes';

export const getBinInfo = async (
  bin: string
): Promise<BinInfo | undefined> => {
  const { getConfig } = _useConfigManager();
  const { apiKey, baseUrl } = getConfig();
  const url = `${baseUrl}/enrichments/card-details?bin=${bin}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'BT-API-KEY': apiKey || '',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return (data as BinInfo) || undefined;
};

const isCardInBinRange = (range: BinRange, cardValue: string) => {
  const binLength = Math.min(range.binMin.length, cardValue.length);
  const cardBin = Number.parseInt(cardValue?.slice(0, binLength));
  const binMin = Number.parseInt(range.binMin?.slice(0, binLength));
  const binMax = Number.parseInt(range.binMax?.slice(0, binLength));
  return binMin <= cardBin && cardBin <= binMax;
};
  
export const useBinLookup = (enabled: boolean, cardValue: string) => {
  const [rawBinInfo, setRawBinInfo] = useState<BinInfo | undefined>(undefined);
  const lastBinRef = useRef<string | undefined>(undefined);
  const cache = useRef<Map<string, BinInfo | undefined>>(new Map());

  const binInfo = useMemo<BinInfo | undefined>(() => {
    if (!rawBinInfo || !cardValue) {
      return undefined;
    }

    const primaryRanges = rawBinInfo.binRange || [];

    const isValidPrimaryRange = primaryRanges?.some((range) =>
      isCardInBinRange(range, cardValue)
    );

    const additionals = rawBinInfo.additional?.filter((additional) => {
      const ranges = additional.binRange;
      return ranges?.some((range) => isCardInBinRange(range, cardValue));
    });

    if (!isValidPrimaryRange && !additionals?.length) {
      return undefined;
    }

    return {
      ...(isValidPrimaryRange ? { ...rawBinInfo, binRange: undefined } : {}),
      additional: additionals?.map((additional) => ({
        ...additional,
        binRange: undefined,
      })),
    };
  }, [rawBinInfo, cardValue]);

  useEffect(() => {
    const bin = cardValue?.slice(0, 6);
    if (!enabled || !bin || bin.length !== 6) {
      setRawBinInfo(undefined);
      lastBinRef.current = undefined;
      return;
    }

    if (bin === lastBinRef.current) {
      return;
    }

    const fetchBinInfo = async () => {
      if (cache.current.has(bin)) {
        setRawBinInfo(cache.current.get(bin));
        lastBinRef.current = bin;
        return;
      }

      try {
        const result = await getBinInfo(bin);
        setRawBinInfo(result);
        cache.current.set(bin, result);
        lastBinRef.current = bin;
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('BIN lookup failed:', err);
        }
      }
    };

    fetchBinInfo();
  }, [cardValue, enabled]);

  return { binInfo };
};
