const AWS = require('aws-sdk')
const log = require('../logger')(__filename)
const StreamResource = require('./StreamResource')

const { Readable } = require('stream')

class StreamDynamodb extends StreamResource {
  constructor (config, parser) {
    super(config, parser)

    log.debug('Atualizando as configurações da AWS: %O', this.config.aws)
    AWS.config.update(this.config.aws)
  }

  getDynamoDbStreamsAPI () {
    if (!this.streamsAPI) {
      this.streamsAPI = new AWS.DynamoDBStreams()
    }

    return this.streamsAPI
  }

  /**
   * Faz dump de uma tabela do dynamo
   */

  async getFullData ({ bucket }) {
    if (!bucket) throw new Error('Parâmetro bucket é obrigatório!')

    const dynamo = new AWS.DynamoDB()

    let first = true
    let scaneados = 0
    let lastEvaluatedKey = null

    // pra não perder a referência no read
    const that = this
    log.debug('Scaneando a tabela %s', bucket.name)
    const inStream = new Readable({
      async read () {
        if (!first && !lastEvaluatedKey) {
          // informando que não há mais dados
          this.push(null)
          return
        }

        first = false

        log.silly('Last evaluated key %s', lastEvaluatedKey)
        log.info('Requisitando nova página de scan!')
        const options = { TableName: bucket.name, ExclusiveStartKey: lastEvaluatedKey }
        const scan = await dynamo.scan(options).promise()

        scaneados += scan.ScannedCount
        log.info('Itens scaneados até o momento %s', scaneados)

        const formatado = scan.Items
          .map(item => that.parser.formatOut(item))

        log.silly('Quantidade de itens formatados %s', formatado.length)
        const buff = Buffer.from(JSON.stringify({
          data: formatado,
          naming: () => `${bucket.name}_${Date.now()}`
        }))

        log.silly('Buffer a ser enviado %O', buff)

        // envia parte para o processo que ta escutando
        this.push(buff)
        lastEvaluatedKey = scan.LastEvaluatedKey
      }
    })

    return {
      inStream,
      results: {
        bucket,
        total: 0,
        label: 'full-scan',
        executionTime: Date.now()
      }
    }
  }

  /**
   * Traz os registros de um shard de muitos table streams
   */

  async getPartialData ({ bucket, lastResult }) {
    log.info('Processando streams para o bucket %s', bucket.name)
    log.debug('Last bucket result %O', lastResult)

    // pega as streams para a tabela
    const streams = await this.getStreamsForTable(bucket.name)

    // descrição das streams disponiveis
    let descriptions = await Promise.all(
      streams.map(stream => this.describeStream(stream))
    )

    descriptions = descriptions
      .map(description => {
        log.silly('Informações da stream %O', description.StreamLabel)
        log.debug('Status da stream %s: %s', description.StreamLabel, description.StreamStatus)
        log.silly('Stream %s shards: %O', description.StreamLabel, description.Shards)

        const toProcess = this.getClosedShard({
          lastResult,
          description
        })

        return { description, toProcess }
      })
      .filter(data => data.toProcess)

    const that = this
    let isFirst = true
    let nextIterator = null
    let totalRecords = 0
    let currentData = null
    const inStream = new Readable({
      async read () {
        if (!currentData) currentData = descriptions.shift()
        // não tem mais o que processar
        if (!currentData) return this.push(null)

        const { description, toProcess } = currentData

        if (isFirst) {
          nextIterator = await that.getShardIterator({
            shardId: toProcess.ShardId,
            streamArn: description.StreamArn
          })

          isFirst = false
        }

        const streamsAPI = await that.getDynamoDbStreamsAPI()
        const results = await streamsAPI
          .getRecords({
            ShardIterator: nextIterator,
            Limit: 1000
          })
          .promise()

        log.silly('Iterator records %O', results.Records)
        log.silly('Next iterator %s', results.NextShardIterator)

        const formmated = results.Records.map(record => {
          const parsed = that.parser.formatOut(record.dynamodb.NewImage)
          parsed.eventName = record.eventName
          return parsed
        })

        totalRecords += formmated.length
        if (!lastResult[description.StreamLabel]) {
          lastResult[description.StreamLabel] = {
            processed: []
          }
        }

        nextIterator = results.NextShardIterator
        if (!nextIterator) {
          lastResult[description.StreamLabel].lastProcessed = toProcess.ShardId
          lastResult[description.StreamLabel].processed.push({
            shard: toProcess.ShardId,
            total: totalRecords
          })

          // setando para processar a próxima stream
          isFirst = true
          currentData = null
          nextIterator = null
        }

        const toSend = {
          data: formmated,
          naming: toProcess.ShardId,
          result: description.StreamLabel,
          resultData: lastResult[description.StreamLabel]
        }

        this.push(Buffer.from(JSON.stringify(toSend)))
      }
    })

    return {
      results: {
        ...lastResult,
        ...{ executionTime: Date.now() }
      },
      inStream
    }
  }

  /**
   * Pega as streams disponíveis para uma tabela
   */

  async getStreamsForTable (tableName) {
    const streamsAPI = await this.getDynamoDbStreamsAPI()

    const tableStreams = await streamsAPI
      .listStreams({
        TableName: tableName
      })
      .promise()

    log.silly('Streams para a tabela %s: %O', tableName, tableStreams)
    if (!tableStreams.Streams.length) throw new Error('Bucket %s não tem streams associado a ele!', tableName)

    return tableStreams.Streams
  }

  /**
   * Traz informações detalhadas da stream de uma tabela
   */

  async describeStream (stream) {
    log.debug('Pegando informações sobre a stream %s', stream.StreamLabel)
    const streamsAPI = await this.getDynamoDbStreamsAPI()

    const describe = await streamsAPI
      .describeStream({
        StreamArn: stream.StreamArn
      })
      .promise()

    return describe.StreamDescription
  }

  getClosedShard ({ description, lastResult }) {
    const processed = this.processedShards({ lastResult, stream: description.StreamLabel })
    log.debug('Processed shards %O', processed)

    const closedShards = description.Shards
      // inclui somente os não processados
      .filter(shard => !processed.find(p => p.shard === shard.ShardId))
      // inclui somente shard fechados
      .filter(shard =>
        shard.SequenceNumberRange &&
        shard.SequenceNumberRange.EndingSequenceNumber
      )

    return closedShards.length
      ? closedShards[0]
      : null
  }

  async getShardIterator ({ shardId, streamArn }) {
    const streamAPI = await this.getDynamoDbStreamsAPI()

    const result = await streamAPI
      .getShardIterator({
        ShardId: shardId,
        ShardIteratorType: 'TRIM_HORIZON',
        StreamArn: streamArn
      })
      .promise()

    return result.ShardIterator
  }

  processedShards ({ lastResult, stream }) {
    if (!lastResult[stream] || !lastResult[stream].processed) return []
    return lastResult[stream].processed
  }

  async getShardRecords ({ description, shard }) {
    const streamsAPI = await this.getDynamoDbStreamsAPI()

    const initialIterator = await this.getShardIterator({
      shardId: shard.ShardId,
      streamArn: description.StreamArn
    })

    let records = []
    let nextIterator = initialIterator

    while (nextIterator) {
      const results = await streamsAPI
        .getRecords({ ShardIterator: nextIterator, Limit: 1000 })
        .promise()

      log.silly('Iterator records %O', results.Records)
      log.debug('Next iterator %s', results.NextShardIterator)

      records = records.concat(results.Records)
      nextIterator = results.NextShardIterator
    }

    return records
  }
}

module.exports = StreamDynamodb
