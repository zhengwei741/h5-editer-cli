'use strict';

const path = require('path')

const Package = require('@iop-cli/package')
const log = require('@iop-cli/log')

const SETTINGS = {
  // 默认init包
  // 可通过后台获取 定制不同的初始化方法
  // init: '@iop-cli/init',
  init: '@imooc-cli-dev',
}

const CACHE_DIR = 'dependencies'

async function exec () {
  let targetPath = process.env.TARGET_PATH
  const homepath = process.env.CLI_HOME_PATH

  log.verbose('targetPath', targetPath)
  log.verbose('homepath', homepath)

  const cmd = arguments[arguments.length - 1]
  // 获取 操作名
  const cmdName = cmd.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  let pkg

  if (!targetPath) {
    // 未指定本地路径
    // 生成缓存路径
    targetPath = path.resolve(homepath, CACHE_DIR)
    const storeDir = path.resolve(targetPath, 'node_modules')

    log.verbose(storeDir, 'storeDir')

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })

    await pkg.install()

  } else {
    // 指定本地路径 直接去路径中读取 入口文件
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }

  const rootPath = pkg.getRootFilePath()

  log.verbose(rootPath, '----rootPath')

  // if (rootPath) {
  //   // 加载入口文件
  //   require(rootPath).apply(null, arguments)
  // }
}

module.exports = exec;
