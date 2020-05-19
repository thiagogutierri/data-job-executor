const log = require('../logger')(__filename)

/**
 * Essa classe é só um modelo (abstract), usar as filhas!
 */

class Job {
  constructor (configSource) {
    this.configSource = configSource
    this.executing = false
  }

  /**
   * Fala se pode iniciar a execução e altera o stado da execução caso possa iniciar
   */
  start () {
    if (this.executing) {
      return false
    }

    this.executing = true
    return true
  }

  /**
   * Seta executing pra false
   */
  end () {
    this.executing = false
  }

  /**
   * Pega uma nova versão das configurações, útil pra quando o job é executado com cron interna
   */
  async freshConfig () {
    await this.configSource.reload()
    return this.configSource
  }

  execute () {
    log.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
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

    const source = this.configSource.configuration.job.resultSource || {
      type: 'JobResultsSource'
    }
    const ResultsSource = require(`./config/${source.type}`)

    return new ResultsSource(this.configSource.configuration.job.resultSource)
  }

  jobBuckets () {
    return this.configSource.configuration.job.buckets || []
  }

  getBucketResults (lastResults, bucket) {
    if (!lastResults) return null

    // arquivo em um formato não conhecido
    if (!Array.isArray(lastResults)) {
      log.warn('Resultados em formato desconhecido!')
      return null
    }

    return lastResults
      .filter(x => x) // filtrando null
      .sort((x, y) => x.executionTime - y.executionTime)
      .find(last => last.bucket.name === bucket)
  }

  /**
   * Decide se faz full scan ou parcial
   */
  executeIngestionJob ({ lastResults, bucket, resource }) {
    const options = {
      bucket,
      lastResults
    }

    return lastResults
      ? resource.getPartialData(options)
      : resource.getFullData(options)
  }
}

module.exports = Job
