const log = require('../logger')(__filename)

class BaseFac {
  static get (path) {
    log.debug('Carregando o módulo %s', path)

    try {
      const module = require(path)
      log.debug('Módulo %s carregado!', path)
      log.debug('Modulo %O', module)

      return module
    } catch (err) {
      log.error('Erro ao carregar o módulo %s - %O', path, err)
      throw err
    }
  }
}

module.exports = BaseFac
