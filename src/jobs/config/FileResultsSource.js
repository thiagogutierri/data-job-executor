const fs = require('fs')
const JobResultsSource = require('./JobResultsSource')

/**
 * Lê e grava JSON
 */

class FileResultsSource extends JobResultsSource {
  constructor (configuration) {
    super()
    this.sourcePath = configuration.path

    // só trabalhamos com json
    if (!this.sourcePath.endsWith('.json')) {
      this.sourcePath = `${this.sourcePath}.json`
    }
  }

  /**
   * Lê um arquivo json
   */

  load () {
    return new Promise((resolve, reject) =>
      fs.readFile(this.sourcePath, (err, data) => {
        if (err) {
          if (err.errno === -2) {
            return resolve(null)
          }

          return reject(err)
        }

        return resolve(JSON.parse(data.toString()))
      })
    )
  }

  /**
   * Grava os resultados em um arquivo json.
   * @param {Object} results objeto de resultados.
   */

  write (results) {
    return new Promise(resolve =>
      fs.writeFile(this.sourcePath, JSON.stringify(results), resolve)
    )
  }
}

module.exports = FileResultsSource
