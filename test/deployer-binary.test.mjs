import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findLocalDeployerBinary } from '../src/deployerBinary.ts'

function fakeFs(existingPaths) {
  const existing = new Set(existingPaths)
  return {
    existsSync(path) {
      return existing.has(path)
    },
  }
}

test('finds composer global dep when no project-local deployer binary exists', async () => {
  const bin = await findLocalDeployerBinary({
    fs: fakeFs(['/tmp/composer-home/vendor/bin/dep']),
    getComposerGlobalHome: async () => '/tmp/composer-home',
  })

  assert.equal(bin, '/tmp/composer-home/vendor/bin/dep')
})

test('prefers project-local deployer binary over composer global dep', async () => {
  const bin = await findLocalDeployerBinary({
    fs: fakeFs(['vendor/bin/dep', '/tmp/composer-home/vendor/bin/dep']),
    getComposerGlobalHome: async () => '/tmp/composer-home',
  })

  assert.equal(bin, 'vendor/bin/dep')
})

test('trims trailing slashes from composer global home before checking dep path', async () => {
  const bin = await findLocalDeployerBinary({
    fs: fakeFs(['/tmp/composer-home/vendor/bin/dep']),
    getComposerGlobalHome: async () => '/tmp/composer-home///',
  })

  assert.equal(bin, '/tmp/composer-home/vendor/bin/dep')
})

test('ignores missing or empty composer global home', async () => {
  const missingHome = await findLocalDeployerBinary({
    fs: fakeFs([]),
    getComposerGlobalHome: async () => '',
  })
  const failedCommand = await findLocalDeployerBinary({
    fs: fakeFs([]),
    getComposerGlobalHome: async () => undefined,
  })

  assert.equal(missingHome, '')
  assert.equal(failedCommand, '')
})
