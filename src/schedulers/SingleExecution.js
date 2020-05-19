const Scheduler = require('./Scheduler')
const log = require('../logger')(__filename)

class SingleExecution extends Scheduler {
  /**
   * Schedule um Job que executará apenas uma vez.
   * @param {Job} job O Job.
   * @param {Object} options Objeto de parâmetros.
   */
  static async schedule (job, options) {
    // loga
    log.debug('Criando scheduler para o job %O', job)

    // executa
    let exitCode = 0
    job.execute()
      .catch(err => {
        log.error('Erro na execução do job!', err, err.stack)
        exitCode = 1
      })
      .finally(() => {
        log.info('Job finalizado, saindo!')
        process.exit(exitCode)
      })
  }
}

module.exports = SingleExecution
