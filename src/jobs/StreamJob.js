const Job = require('./Job')
const logger = require('../logger')(__filename)
const StreamResource = require('../resources/StreamResource')
const ResourceFactory = require('../factories/ResourceFactory')

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class StreamJob extends Job {
  /**
   * Para executar um stream job é necessário um stream resource, essa função garante isso.
   */
  getResources () {
    const inResource = ResourceFactory.get(this.from)
    if (!(inResource instanceof StreamResource)) {
      throw new Error(`Para usar um stream job é necessário especificar um stream resource!
        Resource de entrada (from): ${inResource}
      `)
    }

    const outResource = ResourceFactory.get(this.to)
    if (!(outResource instanceof StreamResource)) {
      throw new Error(`Para usar um stream job é necessário especificar um stream resource!
        Resource de saida (to): ${outResource}
      `)
    }

    return { inResource, outResource }
  }

  execute () {
    logger.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }
}

module.exports = StreamJob
