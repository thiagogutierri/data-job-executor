const StreamJob = require('./StreamJob')
const log = require('../logger')(__filename)

class StreamDataCopy extends StreamJob {
  constructor (configSource) {
    super(configSource)

    if (!configSource.configuration.job) throw new Error('Configuração inválida, esperava a chave "job"')
    if (!configSource.configuration.job.from) throw new Error('Configuração inválida, fonte de dados não especificada')
    if (!configSource.configuration.job.to) throw new Error('Configuração inválida, fonte receptora de dados não especificada')

    this.from = configSource.configuration.job.from
    this.to = configSource.configuration.job.to
  }

  async execute () {
    if (!this.start()) {
      log.debug('Existe uma execução do job em andamento! Retornando...')
      return
    }

    log.info('Iniciando a execução do job de cópia de dados do(a) %s para %s...', this.from, this.to)
    await this.freshConfig()

    // objeto que lida com os resultados
    const resultsSource = await this.getResultsSource()
    const lastResults = await resultsSource.load() || []

    // pega os recursos que vão trabalhar os dados
    const { inResource, outResource } = this.getResources()

    const promises = this.jobBuckets().map(async bucket => {
      // decidir se é full ou incremental
      const bucketLastResult = this.getBucketResults(lastResults, bucket.name)
      const { inStream, results } = await this.executeIngestionJob({ lastResult: bucketLastResult, bucket, resource: inResource })

      return new Promise((resolve, reject) => {
        let currentBuffer = []
        let insertPromises = []

        inStream.on('data', chunk => {
          inStream.pause()

          log.silly('Recebendo %s bytes de informação', chunk.length)
          const received = JSON.parse(chunk.toString('utf8'))

          this._onData(bucket, results, outResource, received.data, currentBuffer, received.naming)
            .then(cb => {
              log.silly('Resumindo a stream!')
              currentBuffer = cb.buffer
              insertPromises = insertPromises.concat(cb.insertPromises)

              if (received.result) {
                results[received.result] = received.resultData
              }

              inStream.resume()
            })
            .catch(reject)
        })

        inStream.on('end', () => {
          log.info('Esperando %s operações de escrita finalizarem.', insertPromises.length)
          return Promise.all(insertPromises)
            .then(() => this._end(outResource, currentBuffer, resultsSource, lastResults, results))
            .then(() => resolve())
            .catch(reject)
        })

        inStream.on('error', reject)
      })
    })

    await Promise.all(promises)
    log.info('Finalizando execução do job')
  }

  async _onData (bucket, results, resource, data, currentBuffer, naming = () => Date.now()) {
    const insertPromises = []
    const buffer = currentBuffer.concat(data)
    results.total += data.length

    log.debug('Current buffer size %s', buffer.length)
    log.silly('Bucket items per json %s', bucket.itemsPerJson)

    if (this.fullData && buffer.length < bucket.itemsPerJson) {
      return {
        buffer,
        insertPromises
      }
    }

    while (
      (this.fullData && buffer.length >= bucket.itemsPerJson) ||
      (!this.fullData && buffer.length)
    ) {
      const part = buffer.splice(0, this.fullData ? bucket.itemsPerJson : buffer.length)
      if (part.length) {
        insertPromises.push(
          resource.insertData({
            bucket,
            data: part,
            outName: typeof naming === 'function' ? naming() : naming,
            append: this.partialData,
            // se for full-scan salva sempre que tiver a quantidade de itens,
            // se não espera terminar o shard
            flush: this.fullData
          })
        )
      }
    }

    return {
      buffer,
      insertPromises
    }
  }

  async _end (resource, currentBuffer, resultsSource, lastResults, results) {
    if (currentBuffer.length) {
      // caso não tenha gravado todos ainda
      await resource.insertData({
        data: currentBuffer,
        outName: `${results.bucket.name}_${Date.now()}`,
        bucket: results.bucket,
        append: true,
        // Terminou a execução, faz flush
        flush: true
      })
    }

    const index = lastResults.findIndex(lr => lr.bucket.name === results.bucket.name)
    if (index === -1) {
      lastResults.push(results)
    } else {
      lastResults[index] = results
    }

    log.info('Gravando resultado da execução: %O', results)
    await resultsSource.write(lastResults)
  }
}

module.exports = StreamDataCopy
