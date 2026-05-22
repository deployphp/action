import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

import { ssh } from '../dist/index.js'

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

test('ssh setup reuses an existing agent across repeated action runs', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deployphp-action-'))
  const homeDir = path.join(tmpDir, 'home')
  const keyPath = path.join(tmpDir, 'id_ed25519')
  const authSock = path.join(tmpDir, 'ssh-auth.sock')
  fs.mkdirSync(homeDir, { recursive: true })
  execFileSync('ssh-keygen', ['-t', 'ed25519', '-N', '', '-f', keyPath], {
    stdio: 'ignore',
  })

  const envSnapshot = {
    HOME: process.env.HOME,
    SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK,
    SSH_AGENT_PID: process.env.SSH_AGENT_PID,
    'INPUT_SKIP-SSH-SETUP': process.env['INPUT_SKIP-SSH-SETUP'],
    'INPUT_PRIVATE-KEY': process.env['INPUT_PRIVATE-KEY'],
  }

  process.env.HOME = homeDir
  process.env.SSH_AUTH_SOCK = authSock
  delete process.env.SSH_AGENT_PID
  process.env['INPUT_SKIP-SSH-SETUP'] = 'false'
  process.env['INPUT_PRIVATE-KEY'] = fs.readFileSync(keyPath, 'utf8')

  try {
    await ssh()
    let listed = spawnSync('ssh-add', ['-l'], {
      env: { ...process.env, SSH_AUTH_SOCK: authSock },
      encoding: 'utf8',
    })
    assert.equal(listed.status, 0, listed.stderr)
    const firstPid = process.env.SSH_AGENT_PID
    assert.ok(firstPid, 'expected SSH_AGENT_PID to be exported')

    await ssh()
    listed = spawnSync('ssh-add', ['-l'], {
      env: { ...process.env, SSH_AUTH_SOCK: authSock },
      encoding: 'utf8',
    })
    assert.equal(listed.status, 0, listed.stderr)
    assert.equal(process.env.SSH_AGENT_PID, firstPid)
    assert.ok(fs.existsSync(authSock), 'expected SSH agent socket to remain available')
  } finally {
    if (process.env.SSH_AGENT_PID) {
      spawnSync('ssh-agent', ['-k'], {
        env: {
          ...process.env,
          SSH_AUTH_SOCK: authSock,
          SSH_AGENT_PID: process.env.SSH_AGENT_PID,
        },
        stdio: 'ignore',
      })
    }
    restoreEnv(envSnapshot)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
