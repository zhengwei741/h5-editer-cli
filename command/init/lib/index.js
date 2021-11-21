const path = require('path')
const fs = require('fs')

const pathExists = require('path-exists').sync
const inquirer = require('inquirer')
const semver = require('semver')

const Command = require('@iop-cli/command')
const Package = require('@iop-cli/package')
const log = require('@iop-cli/log')

const { spinnerStart } = require('@iop-cli/utils')

class InitCommand extends Command {
  constructor(args) {
    super(args)
  }

  init () {
    this.projectName = this._argv[0] || ''
    this.fouce = this._cmd.fouce
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
            if (/[^\w]/g.test(value)) {
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

  async exec () {
    let spinner
    try {
      const info = await this.prepare()
      spinner = spinnerStart('开始下载模板')
      await this.downloadTemplate(info)
      spinner.succeed('下载成功')
    } catch (e) {
      log.error(e.message)
      spinner.fail('下载失败')
    }
  }

  async downloadTemplate ({ name, version, template }) {
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, 'template')
    const pkg = new Package({
      targetPath,
      storeDir: path.resolve(targetPath, 'node_modules'),
      packageName: template,
      packageVersion: 'latest'
    })
    await pkg.install()
  }
}

function init (args) {
  return new InitCommand(args)
}

module.exports = init

module.exports.InitCommand = InitCommand
