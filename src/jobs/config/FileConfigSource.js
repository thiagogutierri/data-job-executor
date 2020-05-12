const log = require('../../logger')(__filename)
const JobConfigSource = require('./JobConfigSource')

class FileConfigSource extends JobConfigSource {
  /**
   * Carrega um arquivo de configuração json em uma variável.
   * @param {String} sourcePath O caminho do arquivo de configuração absoluto ou relativo a esse módulo.
   */

  constructor (sourcePath) {
    super()
    log.debug('Criando job config source com o arquivo %s', sourcePath)
    this.configuration = require(sourcePath)
  }
}

module.exports = FileConfigSource
