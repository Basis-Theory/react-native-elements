const crypto = require('crypto');

// Mock react-native-get-random-values
global.crypto = {
  getRandomValues: (array) => {
    const buffer = crypto.randomBytes(array.length);
    for (let i = 0; i < array.length; i++) {
      array[i] = buffer[i];
    }
    return array;
  },
  subtle: {},
  randomUUID: () => crypto.randomUUID()
};