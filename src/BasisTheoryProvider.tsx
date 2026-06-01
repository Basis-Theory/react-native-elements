import type { PropsWithChildren } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { BasisTheoryElements } from './useBasisTheory';

type BasisTheoryConfig = {
  apiKey?: string;
  baseUrl?: string;
};

type BasisTheoryProviderType = {
  bt?: BasisTheoryElements;
  config?: BasisTheoryConfig;
};

const BasisTheoryContext = createContext<BasisTheoryProviderType>({});

const ConfigManager = (() => {
  let internalConfig: BasisTheoryConfig = {};

  const updateConfig = (updates: Partial<BasisTheoryConfig>): void => {
    internalConfig = { ...internalConfig, ...updates };
  };

  const setConfig = (config: BasisTheoryConfig): void => {
    internalConfig = config;
  };

  const getConfig = (): BasisTheoryConfig => internalConfig;

  const updateApiKey = (apiKey: string): void => {
    internalConfig = { ...internalConfig, apiKey };
  };

  const updateBaseUrl = (baseUrl: string): void => {
    internalConfig = { ...internalConfig, baseUrl };
  };

  return {
    updateConfig,
    setConfig,
    getConfig,
    updateApiKey,
    updateBaseUrl,
  };
})();

const BasisTheoryProvider = ({
  bt,
  children,
}: PropsWithChildren<BasisTheoryProviderType>): JSX.Element => {
  const value = useMemo(
    () => ({
      bt,
      config: ConfigManager.getConfig(),
    }),
    [bt]
  );

  return (
    <BasisTheoryContext.Provider value={value}>
      {children}
    </BasisTheoryContext.Provider>
  );
};

const useBasisTheoryFromContext = (): BasisTheoryProviderType =>
  useContext(BasisTheoryContext);

const useBasisTheoryConfig = () => useContext(BasisTheoryContext).config;

const useConfigManager = () => ConfigManager;


export { BasisTheoryProvider, useBasisTheoryFromContext, useBasisTheoryConfig };

export { useConfigManager as _useConfigManager };


