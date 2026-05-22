import * as core from '@actions/core'
import { $, fs, cd } from 'zx'
import { fileURLToPath } from 'node:url'

$.verbose = true

interface ComposerLock {
  packages?: Array<{ name: string; version: string }>
  'packages-dev'?: Array<{ name: string; version: string }>
}

interface DeployerManifestEntry {
  version: string
  url: string
}

export function deployerReleaseUrl(version: string): string {
  return `https://deployer.org/releases/v${version}/deployer.phar`
}

export function manifestPath(): string {
  return `${process.env['RUNNER_TEMP'] ?? '.'}/deployer-manifest.json`
}

export async function loadDeployerManifest(): Promise<DeployerManifestEntry[]> {
  const path = manifestPath()
  try {
    await $`curl -fsSL -o ${path} https://deployer.org/manifest.json`
  } catch (err) {
    if (fs.existsSync(path)) {
      core.error(fs.readFileSync(path, 'utf8'))
    }
    throw err
  }
  return JSON.parse(fs.readFileSync(path, 'utf8')) as DeployerManifestEntry[]
}

export async function resolveDeployerDownloadUrl(
  version: string,
  explicitVersion: boolean,
): Promise<string | undefined> {
  if (explicitVersion) {
    return deployerReleaseUrl(version)
  }
  const manifest = await loadDeployerManifest()
  return manifest.find((asset) => asset.version === version)?.url
}

export async function main(): Promise<void> {
  try {
    await ssh()
    await dep()
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err))
  }
}

async function ssh(): Promise<void> {
  if (core.getBooleanInput('skip-ssh-setup')) {
    return
  }

  const sshHomeDir = `${process.env['HOME']}/.ssh`

  if (!fs.existsSync(sshHomeDir)) {
    fs.mkdirSync(sshHomeDir)
  }

  const authSock = '/tmp/ssh-auth.sock'
  await $`ssh-agent -a ${authSock}`
  core.exportVariable('SSH_AUTH_SOCK', authSock)

  let privateKey = core.getInput('private-key')
  if (privateKey !== '') {
    privateKey = privateKey.replace(/\r/g, '').trim() + '\n'
    const p = $`ssh-add -`
    p.stdin.write(privateKey)
    p.stdin.end()
    await p
  }

  const knownHosts = core.getInput('known-hosts')
  if (knownHosts !== '') {
    fs.appendFileSync(`${sshHomeDir}/known_hosts`, knownHosts)
    fs.chmodSync(`${sshHomeDir}/known_hosts`, '600')
  } else {
    fs.appendFileSync(`${sshHomeDir}/config`, `StrictHostKeyChecking no`)
    fs.chmodSync(`${sshHomeDir}/config`, '600')
  }

  const sshConfig = core.getInput('ssh-config')
  if (sshConfig !== '') {
    fs.writeFileSync(`${sshHomeDir}/config`, sshConfig)
    fs.chmodSync(`${sshHomeDir}/config`, '600')
  }
}

async function dep(): Promise<void> {
  let bin = core.getInput('deployer-binary')
  const subDirectory = core.getInput('sub-directory').trim()

  if (subDirectory !== '') {
    cd(subDirectory)
  }

  if (bin === '') {
    for (const c of [
      'vendor/bin/deployer.phar',
      'vendor/bin/dep',
      'deployer.phar',
    ]) {
      if (fs.existsSync(c)) {
        bin = c
        console.log(`Using "${c}".`)
        break
      }
    }
  }

  if (bin === '') {
    const explicitVersion = core.getInput('deployer-version')
    let version: string | undefined = explicitVersion
    if (version === '' && fs.existsSync('composer.lock')) {
      const lock: ComposerLock = JSON.parse(
        fs.readFileSync('composer.lock', 'utf8'),
      )
      if (lock.packages) {
        version = lock.packages.find(
          (p) => p.name === 'deployer/deployer',
        )?.version
      }
      if ((version === '' || version === undefined) && lock['packages-dev']) {
        version = lock['packages-dev'].find(
          (p) => p.name === 'deployer/deployer',
        )?.version
      }
    }
    if (version === '' || version === undefined) {
      throw new Error(
        'Deployer binary not found. Please specify deployer-binary or deployer-version.',
      )
    }
    version = version.replace(/^v/, '')
    const url = await resolveDeployerDownloadUrl(
      version,
      explicitVersion !== '',
    )
    if (url === undefined) {
      core.setFailed(
        `The version "${version}" does not exist in the "https://deployer.org/manifest.json" file.`,
      )
    } else {
      console.log(`Downloading "${url}".`)
      await $`curl -LO ${url}`
    }

    await $`sudo chmod +x deployer.phar`
    bin = 'deployer.phar'
  }

  const cmd = core.getInput('dep').split(' ')
  const recipeArgs: string[] = []
  const recipeInput = core.getInput('recipe')
  if (recipeInput !== '') {
    recipeArgs.push(`--file=${recipeInput}`)
  }

  const ansi = core.getBooleanInput('ansi') ? '--ansi' : '--no-ansi'
  const verbosityArgs: string[] = []
  const verbosityInput = core.getInput('verbosity')
  if (verbosityInput !== '') {
    verbosityArgs.push(verbosityInput)
  }
  const options: string[] = []
  try {
    const optionsArg = core.getInput('options')
    if (optionsArg !== '') {
      for (const [key, value] of Object.entries(JSON.parse(optionsArg))) {
        options.push('-o', `${key}=${value}`)
      }
    }
  } catch (e) {
    console.error('Invalid JSON in options')
  }

  let phpBin = 'php'
  const phpBinArg = core.getInput('php-binary')
  if (phpBinArg !== '') {
    phpBin = phpBinArg
  }

  try {
    await $`${phpBin} ${bin} ${cmd} ${recipeArgs} --no-interaction ${ansi} ${verbosityArgs} ${options}`
  } catch (err) {
    core.setFailed(`Failed: dep ${cmd}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main()
}
