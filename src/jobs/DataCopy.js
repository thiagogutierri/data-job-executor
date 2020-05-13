const Job = require('./Job')
const log = require('../logger')(__filename)
const ResourceFactory = require('../factories/ResourceFactory')

class DataCopy extends Job {
  constructor (configSource) {
    super(configSource)

    if (!configSource.configuration.job) throw new Error('Configuração inválida, esperava a chave "job"')
    if (!configSource.configuration.job.from) throw new Error('Configuração inválida, fonte de dados não especificada')
    if (!configSource.configuration.job.to) throw new Error('Configuração inválida, fonte receptora de dados não especificada')

    this.from = configSource.configuration.job.from
    this.to = configSource.configuration.job.to

    this.executing = false
  }

  async execute () {
    if (this.executing) {
      log.debug('Existe uma execução do job em andamento! Retornando...')
      return
    }

    this.executing = true
    try {
      log.info('Iniciando a execução do job de cópia de dados do(a) %s para %s...', this.from, this.to)

      // recarrega as properties
      await this.configSource.reload()

      // objeto que lida com os resultados
      const resultsSource = await this.getResultsSource()
      let lastResults = await resultsSource.load()

      const inResource = ResourceFactory.get(this.from)
      const outResource = ResourceFactory.get(this.to)

      const buckets = this.configSource.configuration.job.buckets || []

      const promises = buckets.map(async bucket => {
        // decidir se é full ou incremental
        const bucketLastResult = this.getBucketResults(lastResults, bucket.name)

        let result = []
        if (!bucketLastResult) {
          log.info('Executando full scan para o bucket %s', bucket.name)
          result = await inResource.getFullData({
            bucket: bucket.name
          })
        } else {
          log.info('Executando busca incremental para o bucket %s', bucket.name)
          result = await inResource.getPartialData({
            bucket: bucket.name,
            lastResult: bucketLastResult
          })
        }

        log.silly('Itens recebidos %O', result)

        let start = 0
        const end = bucketLastResult
          ? result.itens.length
          : bucket.itemsPerJson

        let itens
        while ((itens = result.itens.slice(start, end + start)).length) {
          log.debug('Itens a serem salvos %O', itens)

          // grava o lote
          await outResource.insertData({
            data: itens,
            outName: this.naming({
              bucketName: bucket.name,
              naming: result.naming
            }),
            bucket,
            lastResult: bucketLastResult
          })

          start += end
        }

        return {
          bucket,
          total: result.total,
          executionTime: Date.now()
        }
      })

      if (!Array.isArray(lastResults)) lastResults = []
      await Promise.all(promises)
        .then(results => {
          lastResults = lastResults.concat(results)
        })
        // faz catch para poder salvar o resultado dos que executaram
        .catch(err => log.error(err))

      // escrevendo resultados
      await resultsSource.write(lastResults)
      log.info('Job finalizado')
    } finally {
      this.executing = false
    }
  }

  /**
   * Cria um job results source com base na configuração do job config source.
   * Caso não esteja configurado um result source, o job sempre executará full scan.
   */

  async getResultsSource () {
    if (!this.configSource.configuration.job.resultSource) {
      log.info('Result source não configurado, usando o default!')
      log.info('Para usar jobs incrementais, por favor, configure um result source no jobConfigSource')
      log.info('FileConfigSource example: { "resultSource": { "type": "FileResultsSource", "path": "results" } }')
    }

    const source = this.configSource.configuration.job.resultSource || { type: 'JobResultsSource' }
    const ResultsSource = require(`./config/${source.type}`)

    return new ResultsSource(this.configSource.configuration.job.resultSource)
  }

  getBucketResults (lastResults, bucket) {
    if (!lastResults) return null

    // arquivo em um formato não conhecido
    if (!Array.isArray(lastResults)) {
      log.warn('Resultados em formato desconhecido!')
      return null
    }

    return lastResults
      .sort((x, y) => x.executionTime > y.executionTime)
      .find(res => res.bucket.name === bucket)
  }

  naming (config) {
    return config.naming
      ? `${config.bucketName}_${config.naming}`
      : `${config.bucketName}_${Date.now()}`
  }
}

module.exports = DataCopy
