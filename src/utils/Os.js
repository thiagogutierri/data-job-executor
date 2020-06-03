const { exec } = require('child_process')

class OS {
  static run (command) {
    return new Promise((resolve, reject) =>
      exec(command, (err, stdout, stderr) => {
        if (err) { return reject(err) }
        if (stderr) { return reject(stderr) }
        return resolve(stdout)
      })
    )
  }
}

module.exports = OS
