const Scheduler = require('./Scheduler')
const log = require('../logger')(__filename)

const { CronJob } = require('cron')

// Jobs que essa classe criou
const scheduledJobs = []

class CronScheduler extends Scheduler {
  /**
  * Schedule um Job através de uma expressão cron
  * @param {Job} job O Job que rodará através da expressão cron.
  * @param {Object} options Objeto que deve conter o parametro expression.
  */
  static schedule (job, options) {
    log.info('Criando cron scheduler para o job %O', job)

    // required
    if (!options.expression) {
      throw new Error('Expressão cron não especificada para o job!')
    }

    const cronJob = new CronJob(options.expression, job.execute)

    // coloca ele em algum lugar recuperavel
    scheduledJobs.push({ job, cronJob, options })

    // inicializa o job
    cronJob.start()
  }
}

module.exports = CronScheduler
