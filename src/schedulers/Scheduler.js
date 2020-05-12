const logger = require('../logger')(__filename)

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class Scheduler {
  static schedule (job, options) {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    logger.error('Job %O', job)
    logger.error('Parâmetros: %O', options)

    throw new Error('Classe modelo não deve ser usada!')
  }
}

module.exports = Scheduler
