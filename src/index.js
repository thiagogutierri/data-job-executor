const log = require('./logger')(__filename)
const JobFactory = require('./factories/JobFactory')
const SchedulerFactory = require('./factories/SchedulerFactory')

function start () {
  log.info('Inicializando a aplicação...')

  // O job a ser schedulado
  const jobType = process.env.JOB || 'DataCopy'
  log.info('Criando job %s', jobType)

  // Pegando o objeto de job
  const job = JobFactory.get(jobType)

  const schedulerType = process.env.SCHEDULER || 'singleExecution'
  const schedulerInterval = process.env.SCHEDULER_INTERVAL // A cada minuto

  log.info('Scheduler do tipo %s para o intervalo %s sendo criado...', schedulerType, schedulerInterval)
  const Scheduler = SchedulerFactory.get(schedulerType)

  Scheduler.schedule(job, {
    interval: schedulerInterval
  })
}

// start do job
start()
