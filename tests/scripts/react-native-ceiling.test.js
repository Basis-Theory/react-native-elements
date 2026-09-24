const {
  CeilingError,
  highestStable,
  installSpecs,
} = require('../../scripts/react-native-ceiling');

describe('highestStable', () => {
  it('picks the highest version from an unordered list', () => {
    expect(highestStable(['0.83.9', '0.85.3', '0.83.10', '0.79.7'])).toBe(
      '0.85.3'
    );
  });

  it('compares numerically, not lexically', () => {
    expect(highestStable(['0.85.9', '0.85.10'])).toBe('0.85.10');
  });

  it('ignores prereleases and nightlies', () => {
    expect(
      highestStable([
        '0.85.3',
        '0.86.0-rc.1',
        '0.85.0-nightly-20260219-44901aaf9',
      ])
    ).toBe('0.85.3');
  });

  it('accepts the bare string npm returns for a single match', () => {
    expect(highestStable('0.79.7')).toBe('0.79.7');
  });

  it('throws when nothing stable matches', () => {
    expect(() => highestStable(['0.86.0-rc.1'])).toThrow(CeilingError);
    expect(() => highestStable(undefined)).toThrow(CeilingError);
  });
});

describe('installSpecs', () => {
  it('pins react-native, its companions, and react from the peer range', () => {
    expect(installSpecs('0.85.3', { react: '^19.2.3' })).toEqual([
      'react-native@0.85.3',
      'react@19.2.3',
      'react-test-renderer@19.2.3',
      '@react-native/babel-preset@0.85.3',
      '@react-native/jest-preset@0.85.3',
      '@react-native/metro-config@0.85.3',
    ]);
  });

  it('accepts an exact react peer', () => {
    expect(installSpecs('0.85.3', { react: '19.2.3' })[1]).toBe('react@19.2.3');
  });

  it('throws when the react peer cannot be pinned', () => {
    expect(() => installSpecs('0.85.3', { react: '>=19' })).toThrow(
      CeilingError
    );
    expect(() => installSpecs('0.85.3', {})).toThrow(CeilingError);
  });
});
