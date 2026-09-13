const {
  ReleaseError,
  changelogNeedsEntry,
  isPublishConflict,
  isSameArtifact,
  isVersionMissing,
  publishArgs,
  resolveParams,
  tagPointsAt,
} = require('../../scripts/release');

const onMaster = {
  isOnMaster: () => true,
  tagExists: () => false,
  isReleaseCommit: () => false,
};
const offMaster = {
  isOnMaster: () => false,
  tagExists: () => false,
  isReleaseCommit: () => false,
};
const taggedAlready = {
  isOnMaster: () => true,
  tagExists: () => true,
  isReleaseCommit: () => false,
};
const taggedOnReleaseCommit = {
  isOnMaster: () => true,
  tagExists: () => true,
  isReleaseCommit: () => true,
};

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

    test.each(['hotfix', 'v3.1', 'v..', 'v1.2.3.4', ''])(
      'rejects %p as a release tag',
      (releaseTag) => {
        expect(() =>
          resolveParams({ eventName: 'release', releaseTag }, onMaster)
        ).toThrow(/is not a valid semantic version/);
      }
    );

    test('rejects a malformed tag before consulting master', () => {
      const isOnMaster = jest.fn();

      expect(() =>
        resolveParams(
          { eventName: 'release', releaseTag: 'hotfix' },
          { isOnMaster, tagExists: () => false }
        )
      ).toThrow(/is not a valid semantic version/);
      expect(isOnMaster).not.toHaveBeenCalled();
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

    test('rejects a version whose tag belongs to another commit', () => {
      expect(() => resolveParams(dispatch(), taggedAlready)).toThrow(
        /Tag v3\.1\.0 already exists and this is not that release's commit/
      );
    });

    // A run that pushed the tag and then failed must be able to finish.
    test('continues when the checkout is that tag own release commit', () => {
      expect(resolveParams(dispatch(), taggedOnReleaseCommit)).toStrictEqual({
        npmDistTag: 'v3-lts',
        targetBranch: 'release/3.x',
        version: '3.1.0',
      });
    });

    test('asks about the release commit with the tag and the version', () => {
      const isReleaseCommit = jest.fn().mockReturnValue(true);

      resolveParams(dispatch(), {
        isOnMaster: () => true,
        tagExists: () => true,
        isReleaseCommit,
      });

      expect(isReleaseCommit).toHaveBeenCalledWith('v3.1.0', '3.1.0');
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

describe('publishArgs', () => {
  test('publishes to latest when no dist-tag is given', () => {
    expect(publishArgs({})).toStrictEqual(['publish', '--access', 'public']);
  });

  test('publishes under the given dist-tag', () => {
    expect(publishArgs({ distTag: 'v3-lts' })).toStrictEqual([
      'publish',
      '--access',
      'public',
      '--tag',
      'v3-lts',
    ]);
  });

  test('adds the dry-run flag', () => {
    expect(publishArgs({ distTag: 'v3-lts', dryRun: true })).toStrictEqual([
      'publish',
      '--access',
      'public',
      '--tag',
      'v3-lts',
      '--dry-run',
    ]);
  });

  test('never tags a dry run it was not asked to tag', () => {
    expect(publishArgs({ dryRun: true })).toStrictEqual([
      'publish',
      '--access',
      'public',
      '--dry-run',
    ]);
  });
});

describe('isPublishConflict', () => {
  test.each([
    'npm error code EPUBLISHCONFLICT',
    'npm error 403 You cannot publish over the previously published versions: 3.1.0.',
    'Cannot publish over the previously published version 3.1.0',
    'You cannot republish a version that already exists',
  ])('treats %p as an already published version', (output) => {
    expect(isPublishConflict(output)).toBe(true);
  });

  test.each([
    'npm error code EEXIST',
    'EEXIST: file already exists',
    'npm error 403 Forbidden',
    'npm error code ENEEDAUTH',
    'npm error 404 Not found',
    'npm error code E404 version already exists somewhere else',
    '',
    undefined,
  ])('keeps %p a failure', (output) => {
    expect(isPublishConflict(output)).toBe(false);
  });
});

describe('isVersionMissing', () => {
  test.each([
    'npm error code E404',
    "npm error 404 No match found for version 3.1.0",
    'npm error 404 Not Found - GET https://registry.npmjs.org/pkg',
  ])('treats %p as an unpublished version', (output) => {
    expect(isVersionMissing(output)).toBe(true);
  });

  test.each([
    'npm error code ECONNREFUSED',
    'npm error network request to https://registry.npmjs.org failed',
    'npm error code ENOTFOUND',
    'npm error code EAI_AGAIN',
    'npm error code ETIMEDOUT',
    'npm error 500 Internal Server Error',
    'npm error code ENEEDAUTH',
    '',
    undefined,
  ])('refuses to read %p as an answer', (output) => {
    expect(isVersionMissing(output)).toBe(false);
  });
});

describe('isSameArtifact', () => {
  const integrity = 'sha512-abc123';
  const shasum = 'd34db33f';

  test('matches a republish of the very tarball this run built', () => {
    expect(isSameArtifact({ integrity, shasum }, { integrity, shasum })).toBe(
      true
    );
  });

  test('rejects a different tarball published under the same version', () => {
    expect(
      isSameArtifact({ integrity, shasum }, { integrity: 'sha512-zzz', shasum })
    ).toBe(false);
  });

  test('falls back to shasum when integrity is not recorded', () => {
    expect(isSameArtifact({ shasum }, { shasum })).toBe(true);
    expect(isSameArtifact({ shasum }, { shasum: 'other' })).toBe(false);
  });

  test('prefers integrity over a shasum that happens to agree', () => {
    expect(
      isSameArtifact(
        { integrity, shasum },
        { integrity: 'sha512-different', shasum }
      )
    ).toBe(false);
  });

  test.each([
    [undefined, undefined],
    [{}, {}],
    [{ integrity }, {}],
    [{}, { integrity }],
    [null, { integrity }],
  ])('refuses to call %p and %p the same artifact', (published, built) => {
    expect(isSameArtifact(published, built)).toBe(false);
  });
});

describe('tagPointsAt', () => {
  const distTags = { latest: '4.0.3', 'v3-lts': '3.1.0' };

  test('accepts a tag that resolves to the released version', () => {
    expect(tagPointsAt(distTags, 'v3-lts', '3.1.0')).toBe(true);
  });

  test('rejects a tag that has moved on to a later version', () => {
    expect(tagPointsAt(distTags, 'v3-lts', '3.0.9')).toBe(false);
  });

  test('rejects a tag npm does not have', () => {
    expect(tagPointsAt(distTags, 'v4-lts', '4.0.3')).toBe(false);
  });

  test.each([undefined, '', null])('rejects %p as a tag to prove', (distTag) => {
    expect(tagPointsAt(distTags, distTag, '3.1.0')).toBe(false);
  });

  test.each([undefined, null, {}])(
    'rejects %p as a dist-tag listing',
    (tags) => {
      expect(tagPointsAt(tags, 'v3-lts', '3.1.0')).toBe(false);
    }
  );
});
