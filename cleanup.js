import core from '@actions/core'
import { $ } from 'zx'

void (async function main() {
  try {
    await cleanup()
  } catch (err) {
    core.setFailed(err.message)
  }
})()

async function cleanup() {
  if (core.getBooleanInput('skip-ssh-setup')) {
    return
  }

  const sshAgentPid = core.getState('ssh-agent-pid')

  // Remove all keys from ssh-agent and kill process
  await $`ssh-add -D`
  await $`kill ${sshAgentPid}`
}
