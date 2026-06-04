interface FileSystemLike {
  existsSync(path: string): boolean
}

export interface FindLocalDeployerBinaryOptions {
  fs: FileSystemLike
  getComposerGlobalHome?: () => Promise<string | undefined>
}

const PROJECT_LOCAL_DEPLOYER_BINARIES = [
  'vendor/bin/deployer.phar',
  'vendor/bin/dep',
  'deployer.phar',
]

export async function findLocalDeployerBinary({
  fs,
  getComposerGlobalHome,
}: FindLocalDeployerBinaryOptions): Promise<string> {
  for (const candidate of PROJECT_LOCAL_DEPLOYER_BINARIES) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  const composerGlobalHome = (await getComposerGlobalHome?.())?.trim()
  if (composerGlobalHome === undefined || composerGlobalHome === '') {
    return ''
  }

  const composerGlobalDep = `${composerGlobalHome.replace(/\/+$/, '')}/vendor/bin/dep`
  if (fs.existsSync(composerGlobalDep)) {
    return composerGlobalDep
  }

  return ''
}
