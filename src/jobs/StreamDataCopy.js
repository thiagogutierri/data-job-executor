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
      const { inStream, label } = await this.executeIngestionJob({ lastResults: bucketLastResult, bucket, resource: inResource })

      const results = { bucket, label, total: 0, executionTime: Date.now() }
      return new Promise((resolve, reject) => {
        let currentBuffer = []

        inStream.on('data',
          chunk => this._onData(bucket, results, outResource, chunk, currentBuffer)
            .then(cb => {
              currentBuffer = cb
            })
        )

        inStream.on('end', () => this._end(outResource, currentBuffer, resultsSource, lastResults, results)
          .then(resolve))

        inStream.on('close', () => this._end(outResource, currentBuffer, resultsSource, lastResults, results)
          .then(resolve))

        inStream.on('error', reject)
      })
    })

    await Promise.all(promises)
  }

  _onData (bucket, results, resource, chunk, currentBuffer) {
    const data = JSON.parse(chunk.toString())
    currentBuffer = currentBuffer.concat(data)
    results.total += data.length

    log.debug('Recebendo data chunk, current buffer size %s', currentBuffer.length)
    log.debug('Bucket items per json %s', bucket.itemsPerJson)

    if (currentBuffer.length < bucket.itemsPerJson) return currentBuffer

    while (currentBuffer.length >= bucket.itemsPerJson) {
      const part = currentBuffer.splice(0, bucket.itemsPerJson)
      resource.insertData({ data: part, outName: `${bucket.name}_${Date.now()}`, bucket })
    }

    return currentBuffer
  }

  async _end (resource, currentBuffer, resultsSource, lastResults, results) {
    if (currentBuffer.length) {
      // caso não tenha gravado todos ainda
      await resource.insertData({
        data: currentBuffer,
        outName: `${results.bucket.name}_${Date.now()}`,
        bucket: results.bucket
      })
    }

    lastResults.push(results)
    await resultsSource.write(lastResults)
  }
}

module.exports = StreamDataCopy
