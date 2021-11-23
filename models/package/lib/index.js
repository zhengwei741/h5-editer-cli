'use strict';
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync

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
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  async prepare () {
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLastVersion(this.packageName)
    }
  }

  getFilePath (version) {
    // _@iop-cli_core@1.0.1@@iop-cli
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`)
  }

  // emptyDir (fileUrl) {
  //   let _this = this
  //   var files = fs.readdirSync(fileUrl) // 读取该文件夹
  //   files.forEach(function (file) {
  //     var stats = fs.statSync(fileUrl + '/' + file)
  //     if (stats.isDirectory()) {
  //       _this.emptyDir(fileUrl + '/' + file)
  //     } else {
  //       fs.unlinkSync(fileUrl + '/' + file)
  //     }
  //   })
  //   fs.rmdirSync(fileUrl)
  // }

  async update () {
    const cachePaths = this.getCachePath()
    // 最新版本
    const lastVersion = await getLastVersion(this.packageName)

    const lastPaths = {
      [path.resolve(this.storeDir, this.packageName)]: true,
      [this.getFilePath(lastVersion)]: true
    }

    let needUpdate = false
    cachePaths.forEach(path => {
      if (!lastPaths[path]) {
        // 删除原本缓存文件
        fse.emptyDirSync(path)
        needUpdate = true
      }
    })

    if (needUpdate) {
      this._cachePath = lastPaths
      return this.installNPM(lastVersion)
    }
  }

  getCachePath () {
    let cachePath = []
    fs.readdirSync(this.storeDir).forEach(fileName => {
      if (
        fileName.startsWith(this.packageName) ||
        fileName.startsWith(`_${this.cacheFilePathPrefix}`)
      ) {
        cachePath.push(path.resolve(this.storeDir, fileName))
      }
    })
    return cachePath
  }

  exists () {
    return pathExists(path.resolve(this.storeDir, this.packageName))
  }

  async install () {
    await this.prepare()

    if (this.exists()) {
      return this.update()
    }

    return this.installNPM(this.packageVersion)
  }

  installNPM (version) {
    let _this = this
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
    }).then(() => {
      _this.packageVersion = version
    })
  }

  getRootFilePath () {

    function _getRootFilePath (packagePath) {
      // 获取package.json路径
      const dir = pkgDir(packagePath)
      if (dir) {
        log.verbose(dir, 'packagePath')
        // 读取package.json
        const pkg = require(path.resolve(dir, 'package.json'))
        // 寻找main/lib
        // TODO es6 加载模式
        if (pkg && pkg.main) {
          return formatPath(path.resolve(dir, pkg.main))
        }
      }
      return null
    }

    if (this.storeDir) {
      return _getRootFilePath(this.getFilePath(this.packageVersion))
    } else {
      return _getRootFilePath(this.packagePath)
    }

  }

}

function formatPath (p) {
  if (p && typeof p === 'string') {
    const sep = path.sep;
    if (sep === '/') {
      return p
    } else {
      return p.replace(/\\/g, '/')
    }
  }
  return p;
}

module.exports = Package