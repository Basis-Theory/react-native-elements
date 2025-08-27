import { useEffect, useRef, useState } from 'react';
import { useBasisTheoryFromContext } from '../BasisTheoryProvider';
import type { BasisTheoryElements } from '../useBasisTheory';
import type { BinInfo } from '../CardElementTypes';

export const getBinInfo = async (
    bt: BasisTheoryElements,
    bin: string,
  ): Promise<BinInfo | undefined> => {
    const { apiKey, apiBaseUrl } = bt.config;
    const url = `${apiBaseUrl}/enrichments/card-details?bin=${bin}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'BT-API-KEY': apiKey,
      },
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    return (data as BinInfo) || undefined;
};
  
export const useBinLookup = (enabled: boolean, bin: string) => {
  const { bt } = useBasisTheoryFromContext();

  const [binInfo, setBinInfo] = useState<BinInfo | undefined>(undefined);
  const lastBinRef = useRef<string | undefined>(undefined);
  const cache = useRef<Map<string, BinInfo | undefined>>(new Map());

  useEffect(() => {
    if (!enabled || !bin || bin.length !== 6) {
      setBinInfo(undefined);
      lastBinRef.current = undefined;
      return;
    }

    if (bin === lastBinRef.current) {
      return;
    }

    const fetchBinInfo = async () => {
      if (cache.current.has(bin)) {
        setBinInfo(cache.current.get(bin));
        lastBinRef.current = bin;
        return;
      }

      try {
        const result = await getBinInfo(bt!, bin);
        setBinInfo(result);
        cache.current.set(bin, result);
        lastBinRef.current = bin;
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('BIN lookup failed:', err);
        }
      }
    };

    fetchBinInfo();
  }, [bin, enabled]);

  return { binInfo };
};