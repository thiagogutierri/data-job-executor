const log = require('../logger')(__filename)
const Job = require('./Job')

class DataCopy extends Job {
  constructor (config, parser) {
    super(config, parser)

    if (!config.configuration.job) throw new Error('Configuração inválida, esperava a chave "job"')
    if (!config.configuration.job.from) throw new Error('Configuração inválida, fonte de dados não especificada')
    if (!config.configuration.job.to) throw new Error('Configuração inválida, fonte receptora de dados não especificada')

    this.from = config.configuration.job.from
    this.to = config.configuration.job.to
  }

  execute () {
    log.info('Iniciando a execução do job de cópia de dados do(a) %s para %s...', this.from, this.to)
  }
}

module.exports = DataCopy
