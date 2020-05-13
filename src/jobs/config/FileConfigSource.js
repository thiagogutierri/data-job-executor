const log = require('../../logger')(__filename)
const JobConfigSource = require('./JobConfigSource')

const { requireUncached } = require('../../utils')

class FileConfigSource extends JobConfigSource {
  /**
   * Carrega um arquivo de configuração json em uma variável.
   * @param {String} sourcePath O caminho do arquivo de configuração absoluto ou relativo a esse módulo.
   */

  constructor (sourcePath) {
    super()
    this.sourcePath = sourcePath
    this.load()
  }

  load () {
    if (!this.sourcePath) throw new Error('Impossível carregar configuração sem o caminho do arquivo!')

    this.configuration = requireUncached(this.sourcePath)
    log.debug('Config source carregado com o arquivo %s - %O', this.sourcePath, this.configuration)
  }

  reload () {
    this.load()
  }
}

module.exports = FileConfigSource
