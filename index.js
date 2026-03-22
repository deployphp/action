import core from '@actions/core'
import { $, fs, cd } from 'zx'

void async function main() {
  try {
    await ssh()
    await dep()
  } catch (err) {
    core.setFailed(err.message)
  }
}()

async function ssh() {
  if (core.getBooleanInput('skip-ssh-setup')) {
    return
  }

  let sshHomeDir = `${process.env['HOME']}/.ssh`

  if (!fs.existsSync(sshHomeDir)) {
    fs.mkdirSync(sshHomeDir)
  }

  let authSock = '/tmp/ssh-auth.sock'
  await $`ssh-agent -a ${authSock}`
  core.exportVariable('SSH_AUTH_SOCK', authSock)

  let privateKey = core.getInput('private-key')
  if (privateKey !== '') {
    privateKey = privateKey.replace('/\r/g', '').trim() + '\n'
    let p = $`ssh-add -`
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

  let sshConfig = core.getInput('ssh-config')
  if (sshConfig !== '') {
    fs.writeFileSync(`${sshHomeDir}/config`, sshConfig)
    fs.chmodSync(`${sshHomeDir}/config`, '600')
  }
}

async function dep() {
  let dep = core.getInput('deployer-binary')
  let subDirectory = core.getInput('sub-directory').trim()

  if (subDirectory !== '') {
    cd(subDirectory)
  }

  if (dep === '')
    for (let c of ['vendor/bin/deployer.phar', 'vendor/bin/dep', 'deployer.phar']) {
      if (fs.existsSync(c)) {
        dep = c
        console.log(`Using "${c}".`)
        break
      }
    }

  if (dep === '') {
    let version = core.getInput('deployer-version')
    if (version === '' && fs.existsSync('composer.lock')) {
      let lock = JSON.parse(fs.readFileSync('composer.lock', 'utf8'))
      if (lock['packages']) {
        version = lock['packages']
          .find(p => p.name === 'deployer/deployer')
          ?.version
      }
      if ((version === '' || typeof version === 'undefined') && lock['packages-dev']) {
        version = lock['packages-dev']
          .find(p => p.name === 'deployer/deployer')
          ?.version
      }
    }
    if (version === '' || typeof version === 'undefined') {
      throw new Error('Deployer binary not found. Please specify deployer-binary or deployer-version.')
    }
    version = version.replace(/^v/, '')
    let manifest = JSON.parse((await $`curl -L https://deployer.org/manifest.json`).stdout)
    let url
    for (let asset of manifest) {
      if (asset.version === version) {
        url = asset.url
        break
      }
    }
    if (typeof url === 'undefined') {
      core.setFailed(`The version "${version}"" does not exist in the "https://deployer.org/manifest.json" file."`)
    } else {
      console.log(`Downloading "${url}".`)
      await $`curl -LO ${url}`
    }

    await $`sudo chmod +x deployer.phar`
    dep = 'deployer.phar'
  }

  let cmd = core.getInput('dep').split(' ')
  let recipe = core.getInput('recipe')
  if (recipe !== '') {
    recipe = `--file=${recipe}`
  }

  let ansi = core.getBooleanInput('ansi') ? '--ansi' : '--no-ansi'
  let verbosity = core.getInput('verbosity')
  let options = []
  try {
    let optionsArg = core.getInput('options')
    if (optionsArg !== '') {
      for (let [key, value] in Object.entries(JSON.parse(optionsArg))) {
        options.push('-o', `${key}=${value}`)
      }
    }
  } catch (e) {
    console.error('Invalid JSON in options')
  }

  let phpBin = 'php'
  let phpBinArg = core.getInput('php-binary');
    if (phpBinArg !== '') {
        phpBin = phpBinArg
    }

  let branch = core.getInput('branch')
  let branchOption = branch !== '' ? `--branch=${branch}` : ''

  try {
    await $`${phpBin} ${dep} ${cmd} ${recipe} --no-interaction ${ansi} ${verbosity} ${options} ${branchOption}`
  } catch (err) {
    core.setFailed(`Failed: dep ${cmd}`)
  }
}
