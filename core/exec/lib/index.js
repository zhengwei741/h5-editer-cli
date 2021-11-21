'use strict';

const path = require('path')
const cp = require('child_process')

const Package = require('@iop-cli/package')
const log = require('@iop-cli/log')

const SETTINGS = {
  // 默认init包
  // 可通过后台获取 定制不同的初始化方法
  // init: '@iop-cli/init',
  init: 'pkg-dir',
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
  // const packageVersion = '4.0.0'

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

  if (rootPath) {
    // 加载入口文件
    try {
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const o = {}
      Object.keys(cmd).forEach(key => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o

      // require(rootPath).call(null, Array.from(arguments))

      let code = `require('${rootPath}').call(null, ${JSON.stringify(args)})`
      // 这种方式路径需要转化 E:/workspace/github/iop-cli/command/init/lib/index.js
      const child = cp.spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit'
      })

      child.on('error', e => {
        log.error(e)
        process.exit(1)
      })

      child.on('exit', e => {
        log.verbose('执行结束')
        process.exit(e)
      })

    } catch (e) {
      log.error(e.message)
    }
  } else {
    log.verbose(rootPath, '未找到rootPath')
  }
}

module.exports = exec;
