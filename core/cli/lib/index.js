const path = require('path')
const userHome = require('os').homedir()
// 版本对比
const semver = require('semver')
const colors = require('colors')
const pathExists = require('path-exists')
const dotenv = require('dotenv')

const pkg = require('../package.json')
const { LOW_NODE_VERSION } = require('./const')

const log = require('@iop-cli/log')
const { getLastVersion } = require('@iop-cli/get-npm-info')

async function core () {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    // checkEnv()
    await updateGlobalVersion()
  } catch (e) {
    log.error(e.message)
  }
}
/**
 * 检查cli版本
 */
function checkPkgVersion () {
  log.info('当前cli版本', pkg.version)
}
/**
 * 检查node版本
 */
function checkNodeVersion () {
  const currentVersion = process.version
  if (!semver.gt(currentVersion, LOW_NODE_VERSION)) {
    throw new Error(colors.red(`iop-cli 需要安装 v${LOW_NODE_VERSION} 以上版本的Node.js`))
  }
}
/**
 * 检测是否时root用户
 * root用户创建文件不能操作
 */
function checkRoot () {
  const rootCheck = require('root-check')
  // 如果是root 修改uid
  rootCheck()
}
/**
 * 检查用户主目录
 */
function checkUserHome () {
  if (!userHome || !pathExists(userHome)) {
    throw new Error('当前用户主目录不存在')
  }
}
/**
 * 是否开启debug模式
 */
function checkInputArgs () {
  // minimist 参数转换
  const parseArgs = require('minimist')
  const args = parseArgs(process.argv.slice(2))
  process.env.LOG_LEVEL = args.debug ? 'verbose' : 'info'
  log.level = process.env.LOG_LEVEL
  log.verbose('debug 模式')
}
/**
 * 检查环境变量
 */
function checkEnv () {
  console.log(dotenv)
  // dotenv
  const dotenvPath = path.resolve(userHome, '.env')

  config = dotenv.config({
    path: dotenvPath
  })

  console.log(config)
}
/**
 * 提示更新版本
 */
async function updateGlobalVersion () {
  const npmName = pkg.name
  const lastVersion = await getLastVersion(npmName)
  const currentVersion = pkg.version
  if (lastVersion && semver.lt(currentVersion, lastVersion)) {
    log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
    更新命令： npm install -g ${npmName}`));
  }
}

module.exports = core
