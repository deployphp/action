const core = require('@actions/core')
const fs = require('fs')
const execa = require('execa')

void async function main() {
  try {
    await ssh()
    await dep()
  } catch (err) {
    core.setFailed(err.message)
  }
}()

async function ssh() {
  let ssh = `${process.env['HOME']}/.ssh`

  if (!fs.existsSync(ssh)) {
    fs.mkdirSync(ssh)
  }

  let authSock = '/tmp/ssh-auth.sock'
  execa.sync('ssh-agent', ['-a', authSock])
  core.exportVariable('SSH_AUTH_SOCK', authSock)

  let privateKey = core.getInput('private-key').replace('/\r/g', '').trim() + '\n'
  execa.sync('ssh-add', ['-'], {input: privateKey})

  const knownHosts = core.getInput('known-hosts')
  if (knownHosts !== '') {
    fs.appendFileSync(`${ssh}/known_hosts`, knownHosts)
    fs.chmodSync(`${ssh}/known_hosts`, '600')
  } else {
    fs.appendFileSync(`${ssh}/config`, `StrictHostKeyChecking no`)
    fs.chmodSync(`${ssh}/config`, '600')
  }

  const sshConfig = core.getInput('ssh-config')
  if (sshConfig !== '') {
    fs.writeFileSync(`${ssh}/config`, sshConfig)
    fs.chmodSync(`${ssh}/config`, '600')
  }
}

async function dep() {
  let dep
  for (let c of ['vendor/bin/dep', 'deployer.phar']) {
    if (fs.existsSync(c)) {
      dep = c
      break
    }
  }

  if (!dep) {
    execa.commandSync('curl -LO https://deployer.org/deployer.phar')
    execa.commandSync('sudo chmod +x deployer.phar')
    dep = 'deployer.phar'
  }

  let p = execa.command(`php ${dep} ${core.getInput('dep')}`)
  p.stdout.pipe(process.stdout)
  p.stderr.pipe(process.stderr)
  try {
    await p
  } catch (err) {
    core.setFailed(err.shortMessage)
  }
}
