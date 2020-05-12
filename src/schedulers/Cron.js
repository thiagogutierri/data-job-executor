const Scheduler = require('./Scheduler')
const log = require('../logger')(__filename)

const { CronJob } = require('cron')

// Jobs que essa classe criou
const scheduledJobs = []

class Cron extends Scheduler {
  /**
  * Schedule um Job através de uma expressão cron
  * @param {Job} job O Job que rodará através da expressão cron.
  * @param {Object} options Objeto que deve conter o parametro interval.
  */
  static schedule (job, options) {
    log.info('Criando cron scheduler para o job %O', job)

    // required
    if (!options.interval) {
      throw new Error('Expressão cron não especificada para o job!')
    }

    // A função do job tem que ser () => job.execute() porque se não perdo o contexto do this
    const cronJob = new CronJob(options.interval, () => job.execute())

    // coloca ele em algum lugar recuperavel
    scheduledJobs.push({ job, cronJob, options })

    // inicializa o job
    cronJob.start()
  }
}

module.exports = Cron
