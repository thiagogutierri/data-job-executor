const logger = require('../logger')(__filename)

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class Job {
  constructor (configSource) {
    this.configSource = configSource
  }

  execute () {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }
}

module.exports = Job
