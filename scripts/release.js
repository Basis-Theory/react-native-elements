#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const MAINTENANCE_BRANCH = /^release\/(\d+)\.x$/;
const NPM_DIST_TAG = /^[A-Za-z][A-Za-z0-9._-]*$/;
const VERSION_RANGE = /^[vV]?[0-9xX*]+(?:\.[0-9xX*]+)*$/;

class ReleaseError extends Error {}

const stripLeadingV = (value) => String(value ?? '').trim().replace(/^v/, '');

/**
 * Decides what a run publishes, from where, and under which dist-tag. The
 * repository lookups arrive through `checks` so the decision stays pure.
 */
function resolveParams(
  { eventName, releaseTag, refName, inputVersion, inputDistTag },
  checks
) {
  if (eventName === 'release') {
    // This path publishes to 'latest' and pushes its bump to master, so it
    // only applies to tags on master. Maintenance lines dispatch instead.
    if (!checks.isOnMaster()) {
      throw new ReleaseError(
        `${releaseTag} is not on master. Release a maintenance line by dispatching this workflow from its release/<major>.x branch.`
      );
    }

    return {
      version: stripLeadingV(releaseTag),
      npmDistTag: '', // empty publishes to the 'latest' dist-tag
      targetBranch: 'master',
    };
  }

  if (eventName !== 'workflow_dispatch') {
    throw new ReleaseError(`'${eventName}' does not start a release.`);
  }

  const targetBranch = String(refName ?? '');
  const branch = MAINTENANCE_BRANCH.exec(targetBranch);

  // This workflow holds npm publishing authority, so dispatch is confined to
  // maintenance branches. Everything else, master included, releases through
  // a GitHub Release.
  if (!branch) {
    throw new ReleaseError(
      `Dispatch only runs on release/<major>.x branches, not '${targetBranch}'.`
    );
  }

  const version = stripLeadingV(inputVersion);

  if (!SEMVER.test(version)) {
    throw new ReleaseError(`'${version}' is not a valid semantic version.`);
  }

  if (version.split('.')[0] !== branch[1]) {
    throw new ReleaseError(
      `${targetBranch} releases ${branch[1]}.x versions, not ${version}.`
    );
  }

  const npmDistTag = String(inputDistTag ?? '').trim();

  if (npmDistTag === 'latest') {
    throw new ReleaseError(
      "'latest' tracks the mainline major. Use something like v3-lts."
    );
  }

  if (!NPM_DIST_TAG.test(npmDistTag) || VERSION_RANGE.test(npmDistTag)) {
    throw new ReleaseError(
      `'${npmDistTag}' is not a usable dist-tag - npm rejects anything that reads as a version range. Use something like v3-lts.`
    );
  }

  if (checks.tagExists(`v${version}`)) {
    throw new ReleaseError(`Tag v${version} already exists.`);
  }

  return { version, npmDistTag, targetBranch };
}

const changelogNeedsEntry = (changelog, version) =>
  !changelog.includes(`[${version}](`);

const isTruthy = (value) => ['1', 'true'].includes(String(value ?? '').toLowerCase());

const publishArgs = ({ distTag, dryRun }) => [
  'publish',
  '--access',
  'public',
  // A maintenance line publishes under its own dist-tag so 'latest' keeps
  // pointing at the mainline major.
  ...(distTag ? ['--tag', distTag] : []),
  ...(dryRun ? ['--dry-run'] : []),
];

// Republishing an existing version is the one npm failure this workflow treats
// as success, so a re-run of a partially failed release can finish. Every other
// failure, including anything else that merely mentions an existing file, has
// to stay a failure.
const PUBLISH_CONFLICT =
  /EPUBLISHCONFLICT|cannot publish over (?:the )?previously published version|cannot republish a version that already exists/i;

const isPublishConflict = (output) => PUBLISH_CONFLICT.test(String(output ?? ''));

const capture = (command, args) =>
  execFileSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

const stream = (command, args) =>
  execFileSync(command, args, { cwd: REPO_ROOT, stdio: 'inherit' });

// Probes where a non-zero exit is a meaningful answer rather than a fault, so
// the child's own diagnostics stay out of the log.
const succeeds = (command, args) => {
  try {
    execFileSync(command, args, { cwd: REPO_ROOT, stdio: 'ignore' });

    return true;
  } catch {
    return false;
  }
};

const checks = {
  isOnMaster: () => {
    capture('git', ['fetch', '--quiet', 'origin', 'master']);

    return succeeds('git', ['merge-base', '--is-ancestor', 'HEAD', 'FETCH_HEAD']);
  },
  tagExists: (tag) =>
    succeeds('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`]),
};

const readPackageJson = () =>
  JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

const changelogPath = () => path.join(REPO_ROOT, 'CHANGELOG.md');

const requiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new ReleaseError(`${name} is not set.`);
  }

  return value;
};

const setOutput = (name, value) => {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
};

const commands = {
  'resolve-params': () => {
    const params = resolveParams(
      {
        eventName: process.env.EVENT_NAME,
        releaseTag: process.env.RELEASE_TAG,
        refName: process.env.REF_NAME,
        inputVersion: process.env.INPUT_VERSION,
        inputDistTag: process.env.INPUT_DIST_TAG,
      },
      checks
    );

    setOutput('version', params.version);
    setOutput('npm_dist_tag', params.npmDistTag);
    setOutput('target_branch', params.targetBranch);

    console.log(
      `Releasing ${params.version} from ${params.targetBranch} to dist-tag '${
        params.npmDistTag || 'latest'
      }'`
    );
  },

  // The tag is cut from whatever this run built, so the run must not succeed
  // against a version npm already holds - a retry from a moved branch head
  // would otherwise tag code that is not what consumers get.
  'verify-unpublished': () => {
    const version = requiredEnv('VERSION');
    const { name } = readPackageJson();

    if (succeeds('npm', ['view', `${name}@${version}`, 'version'])) {
      throw new ReleaseError(
        `${name}@${version} is already on npm. Release a new version rather than re-running this one.`
      );
    }
  },

  'update-changelog': () => {
    const version = requiredEnv('VERSION');

    if (!changelogNeedsEntry(fs.readFileSync(changelogPath(), 'utf8'), version)) {
      console.log(`CHANGELOG already lists ${version}; skipping.`);

      return;
    }

    // A release-triggered run already has its tag; drop it locally so
    // conventional-changelog emits this version instead of an empty section.
    // The remote tag is untouched.
    succeeds('git', ['tag', '-d', `v${version}`]);

    stream('yarn', ['changelog:release']);

    if (changelogNeedsEntry(fs.readFileSync(changelogPath(), 'utf8'), version)) {
      console.log(
        `::warning::conventional-changelog produced no ${version} entry (no conventional commits since the previous tag).`
      );
    }
  },

  publish: () => {
    const distTag = process.env.NPM_DIST_TAG;
    const dryRun = isTruthy(process.env.NPM_DRY_RUN);

    console.log('Publishing with OIDC trusted publishing');

    if (distTag) {
      console.log(`Publishing to dist-tag ${distTag}`);
    }

    if (dryRun) {
      console.log('NPM_DRY_RUN is set, nothing will be published');
    }

    try {
      execFileSync('npm', publishArgs({ distTag, dryRun }), {
        cwd: path.join(REPO_ROOT, 'dist'),
        encoding: 'utf8',
        stdio: ['ignore', 'inherit', 'pipe'],
      });
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;

      console.log(output);

      if (!isPublishConflict(output)) {
        throw new ReleaseError(`npm publish failed with exit code ${error.status}.`);
      }

      console.log('Package version already exists, skipping publish');

      return;
    }

    console.log('Package published successfully');
  },

  'commit-version': () => {
    const targetBranch = requiredEnv('TARGET_BRANCH');
    const { version } = readPackageJson();

    capture('git', ['config', '--local', 'user.email', 'platform@basistheory.com']);
    capture('git', ['config', '--local', 'user.name', 'github-actions[bot]']);
    capture('git', ['add', 'package.json', 'CHANGELOG.md']);

    if (succeeds('git', ['diff', '--cached', '--quiet'])) {
      console.log('No changes to commit.');

      return;
    }

    stream('git', ['commit', '-m', `chore(release): ${version} [skip ci]`]);
    stream('git', ['push', 'origin', `HEAD:${targetBranch}`]);
  },

  // Mainline releases are tagged by deploy-dev and released by hand; a
  // maintenance branch has no such path, so tag it here. GITHUB_TOKEN is
  // deliberate - a release it creates does not re-trigger this workflow.
  'create-github-release': () => {
    const version = requiredEnv('VERSION');
    const npmDistTag = requiredEnv('NPM_DIST_TAG');

    stream('gh', [
      'release',
      'create',
      `v${version}`,
      '--target',
      capture('git', ['rev-parse', 'HEAD']).trim(),
      '--title',
      `v${version}`,
      '--notes',
      `Maintenance release published to npm under the \`${npmDistTag}\` dist-tag.`,
      '--latest=false',
    ]);
  },
};

if (require.main === module) {
  const name = process.argv[2];
  const command = commands[name];

  try {
    if (!command) {
      throw new ReleaseError(
        `Unknown command '${name}'. Expected one of: ${Object.keys(commands).join(', ')}.`
      );
    }

    command();
  } catch (error) {
    if (error instanceof ReleaseError) {
      console.log(`::error::${error.message}`);
      process.exit(1);
    }

    throw error;
  }
}

module.exports = {
  ReleaseError,
  changelogNeedsEntry,
  isPublishConflict,
  publishArgs,
  resolveParams,
};
