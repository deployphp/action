const core = require('@actions/core')
const fs = require('fs')
const execa = require('execa')
const split = require('argv-split')

void function main() {
  try {
    ssh()
    dep()
  } catch (err) {
    core.setFailed(err.message)
  }
}()

function ssh() {
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
    fs.chmodSync(`${ssh}/known_hosts`, '644')
  } else {
    fs.appendFileSync(`${ssh}/config`, `StrictHostKeyChecking no`)
  }

  const sshConfig = core.getInput('ssh-config')
  if (sshConfig !== '') {
    fs.writeFile(`${ssh}/config`, sshConfig)
  }
}

function dep() {
  let dep
  for (let c of ['vendor/bin/dep', 'bin/dep', 'deployer.phar']) {
    if (fs.existsSync(c)) {
      dep = c
      break
    }
  }

  if (!dep) {
    execa.commandSync('curl -LO https://deployer.org/deployer.phar')
    execa.commandSync('sudo chmod +x deployer.phar')
    dep = './deployer.phar'
  }

  const subprocess = execa(dep, split(core.getInput('dep')))

  subprocess.stdout.pipe(process.stdout);

  subprocess.catch(err => {
    core.setFailed(err.shortMessage)
  })
}
