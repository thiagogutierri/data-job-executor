const Job = require('./Job')
const log = require('../logger')(__filename)
const ResourceFactory = require('../factories/ResourceFactory')

class DataCopy extends Job {
  constructor (config) {
    super(config)

    if (!config.configuration.job) throw new Error('Configuração inválida, esperava a chave "job"')
    if (!config.configuration.job.from) throw new Error('Configuração inválida, fonte de dados não especificada')
    if (!config.configuration.job.to) throw new Error('Configuração inválida, fonte receptora de dados não especificada')

    this.from = config.configuration.job.from
    this.to = config.configuration.job.to
  }

  execute () {
    log.info('Iniciando a execução do job de cópia de dados do(a) %s para %s...', this.from, this.to)

    const resource = ResourceFactory.get(this.from)
    const buckets = this.config.configuration.job.buckets || []

    buckets.map(async bucket => {
      log.debug('Buscando dados do bucket %s', bucket.name)
      const itens = await resource.getFullData({ bucket: bucket.name })

      log.debug('Itens recebidos %O', itens)
    })
  }
}

module.exports = DataCopy
