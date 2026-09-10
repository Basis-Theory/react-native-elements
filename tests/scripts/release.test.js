const {
  ReleaseError,
  changelogNeedsEntry,
  resolveParams,
} = require('../../scripts/release');

const onMaster = { isOnMaster: () => true, tagExists: () => false };
const offMaster = { isOnMaster: () => false, tagExists: () => false };
const taggedAlready = { isOnMaster: () => true, tagExists: () => true };

const dispatch = (overrides = {}) => ({
  eventName: 'workflow_dispatch',
  refName: 'release/3.x',
  inputVersion: '3.1.0',
  inputDistTag: 'v3-lts',
  ...overrides,
});

describe('resolveParams', () => {
  describe('release event', () => {
    test('publishes the tagged version to latest from master', () => {
      expect(
        resolveParams(
          { eventName: 'release', releaseTag: 'v4.1.0' },
          onMaster
        )
      ).toStrictEqual({
        npmDistTag: '',
        targetBranch: 'master',
        version: '4.1.0',
      });
    });

    test('accepts a tag without the v prefix', () => {
      expect(
        resolveParams({ eventName: 'release', releaseTag: '4.1.0' }, onMaster)
          .version
      ).toBe('4.1.0');
    });

    test('rejects a tag that is not on master', () => {
      expect(() =>
        resolveParams({ eventName: 'release', releaseTag: 'v3.1.0' }, offMaster)
      ).toThrow(/v3\.1\.0 is not on master/);
    });
  });

  describe('dispatch', () => {
    test('publishes the requested version under the requested dist-tag', () => {
      expect(resolveParams(dispatch(), onMaster)).toStrictEqual({
        npmDistTag: 'v3-lts',
        targetBranch: 'release/3.x',
        version: '3.1.0',
      });
    });

    test('accepts a version with the v prefix', () => {
      expect(
        resolveParams(dispatch({ inputVersion: 'v3.1.0' }), onMaster).version
      ).toBe('3.1.0');
    });

    test('accepts a prerelease version', () => {
      expect(
        resolveParams(dispatch({ inputVersion: '3.1.0-beta.1' }), onMaster)
          .version
      ).toBe('3.1.0-beta.1');
    });

    test('never consults master', () => {
      const isOnMaster = jest.fn();

      resolveParams(dispatch(), { isOnMaster, tagExists: () => false });

      expect(isOnMaster).not.toHaveBeenCalled();
    });

    test.each(['master', 'main', 'release', 'fix/hotfix-3x', 'release/3.1.x'])(
      'refuses to run on %s',
      (refName) => {
        expect(() => resolveParams(dispatch({ refName }), onMaster)).toThrow(
          /only runs on release\/<major>\.x branches/
        );
      }
    );

    test.each(['3.1', '3', 'latest', '3.1.0.1', ''])(
      'rejects %p as a version',
      (inputVersion) => {
        expect(() =>
          resolveParams(dispatch({ inputVersion }), onMaster)
        ).toThrow(/is not a valid semantic version/);
      }
    );

    test('rejects a version from another major', () => {
      expect(() =>
        resolveParams(dispatch({ inputVersion: '4.1.0' }), onMaster)
      ).toThrow('release/3.x releases 3.x versions, not 4.1.0.');
    });

    test('rejects latest so it keeps tracking the mainline major', () => {
      expect(() =>
        resolveParams(dispatch({ inputDistTag: 'latest' }), onMaster)
      ).toThrow(/'latest' tracks the mainline major/);
    });

    test.each(['v3', '3.x', '3', 'x', '*', '1.2.3', 'v3.x'])(
      'rejects %p as a dist-tag because npm reads it as a version range',
      (inputDistTag) => {
        expect(() =>
          resolveParams(dispatch({ inputDistTag }), onMaster)
        ).toThrow(/is not a usable dist-tag/);
      }
    );

    test.each(['', '  ', '-lts', '.lts', 'v3 lts'])(
      'rejects %p as a dist-tag',
      (inputDistTag) => {
        expect(() =>
          resolveParams(dispatch({ inputDistTag }), onMaster)
        ).toThrow(/is not a usable dist-tag/);
      }
    );

    test.each(['v3-lts', 'legacy', 'next', 'v3lts', 'lts_3'])(
      'accepts %p as a dist-tag',
      (inputDistTag) => {
        expect(
          resolveParams(dispatch({ inputDistTag }), onMaster).npmDistTag
        ).toBe(inputDistTag);
      }
    );

    test('rejects a version that is already tagged', () => {
      expect(() => resolveParams(dispatch(), taggedAlready)).toThrow(
        'Tag v3.1.0 already exists.'
      );
    });

    test('looks for the tag under its v prefix', () => {
      const tagExists = jest.fn().mockReturnValue(false);

      resolveParams(dispatch(), { isOnMaster: () => true, tagExists });

      expect(tagExists).toHaveBeenCalledWith('v3.1.0');
    });
  });

  test('rejects an event that does not start a release', () => {
    expect(() =>
      resolveParams({ eventName: 'push', refName: 'release/3.x' }, onMaster)
    ).toThrow("'push' does not start a release.");
  });

  test('reports failures as ReleaseError', () => {
    expect(() => resolveParams(dispatch({ refName: 'master' }), onMaster)).toThrow(
      ReleaseError
    );
  });
});

describe('changelogNeedsEntry', () => {
  test('is satisfied by an entry for the version', () => {
    expect(
      changelogNeedsEntry('## [3.1.0](https://github.com/compare) (2026-09-10)', '3.1.0')
    ).toBe(false);
  });

  test('reports a missing entry', () => {
    expect(changelogNeedsEntry('## [3.0.1](https://x) (2026-08-01)', '3.1.0')).toBe(
      true
    );
  });

  test('is not satisfied by a version that merely contains it', () => {
    expect(changelogNeedsEntry('## [13.1.0](https://x)', '3.1.0')).toBe(true);
    expect(changelogNeedsEntry('## [3.1.01](https://x)', '3.1.0')).toBe(true);
  });
});
