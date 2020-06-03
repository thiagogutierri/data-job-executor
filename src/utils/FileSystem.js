const fs = require('fs')

/**
 * Promisefy do módulo fs
 */
class FileSystem {
  static read (file) {
    return new Promise((resolve, reject) =>
      fs.readFile(file, (err, data) => err ? reject(err) : resolve(data.toString()))
    )
  }

  static write (data, path) {
    return new Promise((resolve, reject) =>
      fs.writeFile(path, data, err => err ? reject(err) : resolve())
    )
  }

  static append (data, path) {
    return new Promise((resolve, reject) =>
      fs.appendFile(path, data, err => err ? reject(err) : resolve())
    )
  }

  static exists (path) {
    return new Promise((resolve, reject) =>
      // resolvendo um boolean, se tem stats tem arquivo ou diretório
      fs.stat(path, (err, stats) => err ? reject(err) : resolve(!!stats))
    )
  }

  static delete (path) {
    return new Promise((resolve, reject) =>
      fs.unlink(path, err => err ? reject(err) : resolve())
    )
  }
}

module.exports = FileSystem
