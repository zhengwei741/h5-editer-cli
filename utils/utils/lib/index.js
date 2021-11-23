function spinnerStart (msg, text = "loding....") {
  const spinner = require('ora')({ text })
  spinner.info(msg)
  // spinner.succeed('成功'); // 成功信息：前面带个✅的信息
  // spinner.fail('失败'); // 错误信息：前面带个❌的信息
  // spinner.warn('警告'); // 警告信息：前面带个⚠️的信息
  // spinner.info('提示'); // 提示信息：前面带个i的信息
  // spinner.stop(); // 停止，不会留下text
  return spinner
}

function exec (command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return require('child_process').spawn(cmd, cmdArgs, options || {})
}

function execCommand (cmd, args, options = {}) {

  const child = exec(cmd, args, options)

  return new Promise((resolve, reject) => {
    child.on('error', e => {
      reject(e)
    })
    child.on('exit', e => {
      resolve(e)
    })
  })
}

module.exports = {
  spinnerStart,
  execCommand
}
