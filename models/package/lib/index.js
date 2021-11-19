'use strict';
const path = require('path')

const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists')

const log = require('@iop-cli/log')
const { getDefaultRegistry, getLastVersion } = require('@iop-cli/get-npm-info')

class Package {
  constructor(options = {}) {
    if (!options) {
      log.error('Package 类 options 参数不能为空')
    }

    // 包的路径
    this.packagePath = options.targetPath
    // 包名
    this.packageName = options.packageName
    // 版本
    this.packageVersion = options.packageVersion
    // 缓存路径
    this.storeDir = options.storeDir
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  async prepare () {
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLastVersion(this.packageName)
    }
  }

  get cacheFilePath () {
    // _@iop-cli_core@1.0.1@@iop-cli
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  async exist () {
    // 有storeDir 不是本地路径
    if (this.storeDir) {
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.packagePath)
    }
  }

  update () {

  }

  async install () {
    await this.prepare()

    return npminstall({
      root: this.packagePath,
      registry: getDefaultRegistry(),
      storeDir: this.storeDir,
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion
        },
      ],
    })
  }

  getRootFilePath () {
    // 获取package.json路径
    const dir = pkgDir(this.packagePath)
    if (dir) {
      log.verbose(dir, 'packagePath')
      // 读取package.json
      const pkg = require(path.resolve(dir, 'package.json'))
      // 寻找main/lib
      if (pkg && pkg.main) {
        return path.resolve(dir, pkg.main)
      }
    }
    return null
  }

}

module.exports = Package