const Command = require('@iop-cli/command')

class InitCommand extends Command {
  constructor(args) {
    super(args)
  }

  init () {
    this.projectName = this._argv[0] || ''
    this.fouce = this._cmd.fouce
  }

  exec () {

  }
}

function init (args) {
  return new InitCommand(args)
}

module.exports = init

module.exports.InitCommand = InitCommand
