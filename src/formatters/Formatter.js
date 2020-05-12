const logger = require('../logger')(__filename)

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class Formatter {
  static formatIn (data) {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }

  static formatOut (data) {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }
}

module.exports = Formatter
