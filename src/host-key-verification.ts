const HOST_KEY_VERIFICATION_FAILED = /host key verification failed/i

/** Deployer wraps remote output as `[host] < …`. */
const DEPLOYER_HOST_KEY_LINE =
  /^\[([^\]]+)\]\s*<.*host key verification failed/i

const OPENSSH_HOST_KEY_CHANGED = /\bhost key for ([^\s]+) has changed/i
const OPENSSH_HOST_KEY_UNKNOWN = /No \S+ host key is known for (\S+)/i
const OPENSSH_THE_HOST_KEY = /The \S+ host key for ([^\s]+) has changed/i

export function isHostKeyVerificationFailure(output: string): boolean {
  return HOST_KEY_VERIFICATION_FAILED.test(output)
}

export function parseHostsFromHostKeyFailure(output: string): string[] {
  const hosts = new Set<string>()

  for (const line of output.split(/\r?\n/)) {
    const deployer = DEPLOYER_HOST_KEY_LINE.exec(line)
    if (deployer) {
      hosts.add(deployer[1])
      continue
    }

    for (const pattern of [
      OPENSSH_HOST_KEY_CHANGED,
      OPENSSH_HOST_KEY_UNKNOWN,
      OPENSSH_THE_HOST_KEY,
    ]) {
      const match = pattern.exec(line)
      if (match) {
        hosts.add(match[1].replace(/\.$/, ''))
      }
    }
  }

  return [...hosts]
}

export function formatHostKeyVerificationGuidance(
  hosts: string[],
  knownHostsConfigured: boolean,
): string {
  const hostList =
    hosts.length > 0
      ? hosts.join(', ')
      : '(not found in the log — check hosts in your Deployer recipe)'

  const scanExample =
    hosts.length === 1
      ? `  ssh-keyscan -t rsa,ecdsa,ed25519 ${hosts[0]}`
      : '  ssh-keyscan -t rsa,ecdsa,ed25519 YOUR_DEPLOY_HOST'

  const knownHostsHint = knownHostsConfigured
    ? 'The known-hosts input is set, but this host is missing or its key no longer matches the server (for example after reinstall or key rotation).'
    : 'When known-hosts is empty this action disables StrictHostKeyChecking; if you still see this, check ssh-config or other SSH settings.'

  return [
    'SSH host key verification failed for the remote deployment server.',
    `Remote host(s): ${hostList}`,
    '',
    'This refers to the remote server SSH host key (server identity), not your deploy private-key secret.',
    'It is unrelated to github.com unless your Deployer recipe connects to GitHub over SSH.',
    knownHostsHint,
    '',
    'Update the action known-hosts input with a current key, for example:',
    scanExample,
    '',
    'https://github.com/deployphp/action/issues/61',
  ].join('\n')
}

export function commandOutput(err: unknown): string {
  if (
    err !== null &&
    typeof err === 'object' &&
    'stdall' in err &&
    typeof (err as { stdall: unknown }).stdall === 'string'
  ) {
    return (err as { stdall: string }).stdall
  }
  if (err instanceof Error) {
    return err.message
  }
  return String(err)
}
