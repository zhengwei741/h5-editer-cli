const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')

const pathExists = require('path-exists').sync
const inquirer = require('inquirer')
const semver = require('semver')
const ejs = require('ejs')
const glob = require('glob')

const Command = require('@iop-cli/command')
const Package = require('@iop-cli/package')
const log = require('@iop-cli/log')
const { execCommand: exc } = require('@iop-cli/utils')

const { spinnerStart } = require('@iop-cli/utils')

const WHITE_COMMAND = ['npm', 'cnpm']

class InitCommand extends Command {
  constructor(args) {
    super(args)
  }

  init () {
    this.projectName = this._argv[0] || ''
    this.fouce = this._cmd.fouce
  }

  async exec () {
    // 设置选项
    const info = await this.prepare()
    // 下载模板
    await this.downloadTemplate(info)
    // 安装模板
    this.installTemplate(info)
    // 替换ejs模板
    await this.ejsRender(info, { ignore: ['**/node_modules/**', 'public/**'] })
    // 执行安装依赖 执行启动命令
    this.execInstall()
  }

  async prepare () {
    return await inquirer.prompt(
      [
        {
          type: 'input',
          name: 'name',
          message: '请输入项目名称',
          validate (value) {
            var done = this.async()
            if (!value || /[^\w]/g.test(value)) {
              done('请输入合法的项目名称')
              return
            }
            const projectDir = path.resolve(process.cwd(), value)
            if (pathExists(projectDir) && fs.lstatSync(projectDir).isDirectory()) {
              done(`当前已存在【${value}】文件夹`)
              return
            }
            done(null, true)
          }
        },
        {
          type: 'input',
          name: 'version',
          message: '请输入项目版本',
          default: '1.0.0',
          validate (value) {
            var done = this.async()
            if (!(!!semver.valid(value))) {
              done('请输入合法的版本号')
              return
            }
            done(null, true)
          }
        },
        {
          type: 'list',
          name: 'template',
          message: '选择项目模板',
          default: 0,
          choices: this.createTemplateChoices()
        }
      ]
    )
  }

  createTemplateChoices () {
    const templateJson = process.env.TEMPLATE_JSON
    if (!templateJson) {
      return []
    }
    return JSON.parse(templateJson)
  }

  async downloadTemplate ({ template }) {
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, 'template')
    this._targetPath = targetPath
    const pkg = new Package({
      targetPath,
      storeDir: path.resolve(targetPath, 'node_modules'),
      packageName: template,
      packageVersion: 'latest'
    })
    let spinner
    try {
      spinner = spinnerStart('正在下载模板....')
      await pkg.install()
      spinner.succeed('下载成功')
    } catch (e) {
      log.error(e.message)
      spinner.fail('下载失败')
      throw e
    }
  }

  installTemplate ({ template }) {
    const templatePath = path.resolve(this._targetPath, 'node_modules', template, 'template')
    this._templatePath = templatePath
    const cwd = process.cwd()

    if (!pathExists(templatePath)) {
      throw new Error('模板不存在')
    }
    try {
      let spinner = spinnerStart('正在安装模板....')
      fse.copySync(templatePath, cwd)
      spinner.succeed('安装成功')
    } catch (e) {
      log.error(e.message)
      spinner.fail('安装失败')
    }
  }

  checkCommand (cmd) {
    if (!cmd) {
      return
    }
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd
    }
    log.error(`命令: ${cmd}, 不合法`)
    return null
  }

  async execInstall () {
    const templateConfigPath = path.resolve(this._templatePath, 'template.config.js')
    if (pathExists(templateConfigPath)) {
      // 标准模板
      const config = require(templateConfigPath)
      if (config) {
        let { execCommand, installCommand } = config
        // 安装依赖
        const ret = await this.execCommandAsync(installCommand, '安装依赖失败')
        if (ret) {
          // 执行启动命令
          await this.execCommandAsync(execCommand, '执行启动失败')
        }
      }
    }
  }

  async execCommandAsync (command, errMsg) {
    let cmdArray = command.split(' ')
    let cmd = this.checkCommand(cmdArray[0])
    let ret
    if (cmd) {
      ret = await exc(cmd, cmdArray.slice(1), { cwd: process.cwd(), stdio: 'inherit' })
    }
    if (ret !== 0) {
      throw new Error(errMsg)
    }
    return true
  }

  async ejsRender (info, options) {
    return new Promise((resolve, reject) => {
      const cwd = process.cwd()
      glob("**", {
        cwd,
        ignore: options.ignore || '',
        nodir: true,
      }, function (er, files) {
        if (er) {
          reject(er)
        }
        Promise.all(
          files.map(file => {
            return new Promise((resolve1, reject1) => {
              const filePath = path.resolve(cwd, file)
              ejs.renderFile(filePath, info, {}, function (err, str) {
                if (err) {
                  reject1(err)
                }
                fse.writeFileSync(filePath, str)
                resolve1(str)
              })
            })
          })
        ).then(res => {
          resolve(res)
        }).catch(e => {
          reject(e)
        })
      })
    })
  }
}

function init (args) {
  return new InitCommand(args)
}

module.exports = init

module.exports.InitCommand = InitCommand
