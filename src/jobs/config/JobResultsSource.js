const log = require('../../logger')(__filename)

/**
 * Essa classe serve como default para jobs não configurados
 */

class JobResultsSource {
  load () {
    log.info('Result source default não sabe como carregar resultados.')
    return null
  }

  write (results) {
    log.info('Result source default não sabe como gravar esses resultados! %O', results)
  }
}

module.exports = JobResultsSource
