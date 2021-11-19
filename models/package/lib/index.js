'use strict';
const path = require('path')
const fs = require('fs')

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
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLastVersion(this.packageName)
    }
    // 缓存路径
    this.storeDir = options.storeDir
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  getFilePath (version) {
    // _@iop-cli_core@1.0.1@@iop-cli
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`);
  }

  async update () {
    // 最新版本
    const lastVersion = await getLastVersion(this.packageName)
    // 缓存路径
    const cacheFilePath = this.getFilePath(this.packageVersion)
    // 缓存路径不等于最新版本路径 就删除 并下载最新的版本
    if (this.getFilePath(lastVersion) !== cacheFilePath) {
      await this.installNPM(lastVersion)
      // 删除原本缓存文件
      fs.rmdirSync(cacheFilePath)
      this.packageVersion = lastVersion
    }
  }

  async install () {
    const cacheFilePath = this.getFilePath(this.packageVersion)
    if (pathExists(cacheFilePath)) {
      return this.update()
    } else {
      return this.installNPM(this.packageVersion)
    }
  }

  installNPM (version) {
    return npminstall({
      root: this.packagePath,
      registry: getDefaultRegistry(),
      storeDir: this.storeDir,
      pkgs: [
        {
          name: this.packageName,
          version
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