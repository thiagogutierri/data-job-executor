const FileSystem = require('../../utils/FileSystem')
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

  async load () {
    let file = null
    try {
      file = JSON.parse(
        await FileSystem.read(this.sourcePath)
      )
    } catch (err) {
      if (err.errno !== -2) {
        throw err
      }
    }

    return file
  }

  /**
   * Grava os resultados em um arquivo json.
   * @param {Object} results objeto de resultados.
   */

  write (results) {
    return FileSystem.write(JSON.stringify(results), this.sourcePath)
  }
}

module.exports = FileResultsSource
