const logger = require('../../logger')(__filename)

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class JobConfigSource {
  constructor () {
    this.configuration = {}
  }

  load () {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }

  reload () {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }
}

module.exports = JobConfigSource
