// This MUST be imported before any @noble libraries

import 'react-native-get-random-values';
import { install } from 'react-native-quick-crypto';

install();

if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('react-native-quick-crypto');
  if (webcrypto) {
    globalThis.crypto = webcrypto;
  } else {
    throw new Error('Failed to setup crypto polyfill for React Native');
  }
}

if (!globalThis.crypto?.getRandomValues) {
  throw new Error('crypto.getRandomValues is not available after polyfill setup');
}