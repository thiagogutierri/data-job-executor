const log = require('./logger')(__filename)
const JobFactory = require('./factories/JobFactory')

function start () {
  log.info('Inicializando a aplicação...')

  // O job a ser schedulado
  const jobType = process.env.JOB || 'DataCopy'
  log.info('Criando job %s', jobType)

  // Pegando o objeto de job
  const job = JobFactory.get(jobType)
  job.execute()
    .catch(err => log.error(err.stack))
    .finally(process.exit)
}

// start do job
start()
