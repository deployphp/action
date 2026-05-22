import test from 'node:test'
import assert from 'node:assert/strict'

import {
  deployerReleaseUrl,
  manifestPath,
} from '../dist/index.js'

test('deployerReleaseUrl builds the canonical release download URL', () => {
  assert.equal(
    deployerReleaseUrl('7.5.12'),
    'https://deployer.org/releases/v7.5.12/deployer.phar',
  )
  assert.equal(
    deployerReleaseUrl('8.0.0-beta'),
    'https://deployer.org/releases/v8.0.0-beta/deployer.phar',
  )
})

test('manifestPath uses RUNNER_TEMP when available', () => {
  const previous = process.env.RUNNER_TEMP
  process.env.RUNNER_TEMP = '/tmp/github-runner'
  try {
    assert.equal(manifestPath(), '/tmp/github-runner/deployer-manifest.json')
  } finally {
    if (previous === undefined) {
      delete process.env.RUNNER_TEMP
    } else {
      process.env.RUNNER_TEMP = previous
    }
  }
})
