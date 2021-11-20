const semver = require('semver')
const colors = require('colors')

const log = require('@iop-cli/log')

const LOW_NODE_VERSION = '12.0.0'

class Command {
  constructor(args) {
    this.runner = new Promise((resovle, reject) => {
      let chain = Promise.resolve(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs(args))
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch((e) => {
        log.error(colors.red(e.message))
      })
    })
  }

  /**
   * 检查node版本
   */
  checkNodeVersion () {
    const currentVersion = process.version
    if (!semver.gt(currentVersion, LOW_NODE_VERSION)) {
      throw new Error(colors.red(`iop-cli 需要安装 v${LOW_NODE_VERSION} 以上版本的Node.js`))
    }
  }


  initArgs (args) {
    this._cmd = args[args.length - 1]
    this._argv = args.slice(0, args.length - 1)
    log.verbose('initArgs', this._cmd, this._argv)
  }

  init () {
    throw new Error('init 函数必须实现')
  }

  exec () {
    throw new Error('exec 函数必须实现')
  }
}

module.exports = Command