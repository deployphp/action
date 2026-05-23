import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatHostKeyVerificationGuidance,
  isHostKeyVerificationFailure,
  parseHostsFromHostKeyFailure,
} from './host-key-verification.ts'

const deployerLog = `
✈︎ Deploying deploy-test on 1.2.3.4
[23.94.156.6] > echo $0
[23.94.156.6] < ssh multiplexing initialization
[23.94.156.6] < Host key verification failed.
`.trim()

describe('isHostKeyVerificationFailure', () => {
  it('detects deployer host key failures', () => {
    assert.equal(isHostKeyVerificationFailure(deployerLog), true)
  })

  it('ignores unrelated output', () => {
    assert.equal(isHostKeyVerificationFailure('deploy finished'), false)
  })
})

describe('parseHostsFromHostKeyFailure', () => {
  it('parses deployer bracket host lines', () => {
    assert.deepEqual(parseHostsFromHostKeyFailure(deployerLog), ['23.94.156.6'])
  })

  it('parses OpenSSH host key changed messages', () => {
    const output = `RSA host key for deploy.example.com has changed and you have requested strict checking.
Host key verification failed.`
    assert.deepEqual(parseHostsFromHostKeyFailure(output), [
      'deploy.example.com',
    ])
  })

  it('parses unknown host key messages', () => {
    const output = `No ED25519 host key is known for staging.example.net.
Host key verification failed.`
    assert.deepEqual(parseHostsFromHostKeyFailure(output), [
      'staging.example.net',
    ])
  })

  it('deduplicates repeated hosts', () => {
    const output = `[10.0.0.1] < Host key verification failed.
[10.0.0.1] < Host key verification failed.`
    assert.deepEqual(parseHostsFromHostKeyFailure(output), ['10.0.0.1'])
  })
})

describe('formatHostKeyVerificationGuidance', () => {
  it('names the remote host and ssh-keyscan command', () => {
    const message = formatHostKeyVerificationGuidance(['1.2.3.4'], true)
    assert.match(message, /Remote host\(s\): 1\.2\.3\.4/)
    assert.match(message, /ssh-keyscan -t rsa,ecdsa,ed25519 1\.2\.3\.4/)
    assert.match(message, /not your deploy private-key secret/)
    assert.match(message, /unrelated to github\.com/)
  })

  it('mentions missing known-hosts match when configured', () => {
    const message = formatHostKeyVerificationGuidance([], true)
    assert.match(message, /known-hosts input is set/)
  })
})
