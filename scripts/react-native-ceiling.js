#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

const STABLE = /^\d+\.\d+\.\d+$/;
const PINNABLE = /^[\^~]?(\d+\.\d+\.\d+)$/;

// Released in lockstep with react-native; the test suite needs matching versions.
const COMPANIONS = [
  '@react-native/babel-preset',
  '@react-native/jest-preset',
  '@react-native/metro-config',
];

class CeilingError extends Error {}

const compareVersions = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));

  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/**
 * `npm view <pkg>@<range> version` answers with a bare string for one match,
 * an unordered array for several, and includes prereleases.
 */
function highestStable(versions) {
  const stable = [].concat(versions ?? []).filter((v) => STABLE.test(v));

  if (stable.length === 0) {
    throw new CeilingError(
      'No stable react-native release satisfies the peer range.'
    );
  }

  return stable.sort(compareVersions).at(-1);
}

function installSpecs(version, peers) {
  const match = PINNABLE.exec(String(peers?.react ?? '').trim());

  if (!match) {
    throw new CeilingError(
      `Cannot pin react from react-native@${version}'s peer range '${peers?.react}'.`
    );
  }

  const react = match[1];

  return [
    `react-native@${version}`,
    `react@${react}`,
    `react-test-renderer@${react}`,
    ...COMPANIONS.map((name) => `${name}@${version}`),
  ];
}

const npmView = (spec, field) =>
  JSON.parse(
    execFileSync('npm', ['view', spec, field, '--json'], { encoding: 'utf8' })
  );

function main() {
  const { peerDependencies } = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')
  );
  const range = peerDependencies['react-native'];
  const version = highestStable(npmView(`react-native@${range}`, 'version'));
  const specs = installSpecs(
    version,
    npmView(`react-native@${version}`, 'peerDependencies')
  );

  console.log(`Top of the react-native peer range '${range}': ${version}`);
  execFileSync('yarn', ['add', '--dev', '--ignore-scripts', ...specs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    if (error instanceof CeilingError) {
      console.log(`::error::${error.message}`);
      process.exit(1);
    }

    throw error;
  }
}

module.exports = { CeilingError, highestStable, installSpecs };
