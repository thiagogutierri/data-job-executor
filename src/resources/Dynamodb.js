const AWS = require('aws-sdk')
const Resource = require('./Resource')
const log = require('../logger')(__filename)

class Dynamodb extends Resource {
  constructor (config, parser) {
    super(config, parser)

    log.debug('Atualizando as configurações da AWS: %O', this.config.aws)
    AWS.config.update(this.config.aws)
  }

  /**
   * Faz dump de uma tabela do dynamo
   */

  async getFullData ({ bucket }) {
    if (!bucket) throw new Error('Parâmetro bucket é obrigatório!')

    const dynamo = new AWS.DynamoDB()

    log.debug('Scaneando a tabela %s', bucket)
    let scan = await dynamo.scan({ TableName: bucket }).promise()

    const result = {
      label: 'full-scan',
      total: scan.Count,
      // não usar a forma contrata do map se não o parser perde a referencia do this
      itens: scan.Items.map(item => this.parser.formatOut(item))
    }

    let scaneados = scan.ScannedCount
    // páginas limitadas a 1MB de dados
    while (scan.LastEvaluatedKey) {
      log.debug('Itens scaneados até o momento %s', scaneados)
      log.debug('Requisitando nova página de scan!')
      scan = await dynamo.scan({ TableName: bucket, ExclusiveStartKey: scan.LastEvaluatedKey }).promise()

      scaneados += scan.ScannedCount
      result.total += scan.Count

      // não usar a forma contrata do map se não o parser perde a referencia do this
      result.itens = result.itens.concat(
        scan.Items.map(item => this.parser.formatOut(item))
      )
    }

    log.debug('Tabela do dynamo scaneada!')
    log.debug('Total de itens %s', result.total)
    log.debug('Total de itens scaneados %s', scaneados)

    return [result]
  }

  /**
   * Pega ultimas alterações de uma tabela baseado em uma table stream
   */

  async getPartialData ({ bucket, lastResult }) {
    log.debug('Last bucket result %O', lastResult)
    log.info('Processando streams para o bucket %s', bucket)

    // pega as streams para a tabela
    const streams = await this.getStreamsForTable(bucket)

    // descrição das streams disponiveis
    const descriptions = await Promise.all(
      streams.map(stream => this.describeStream(stream))
    )

    const dataP = descriptions.map(async description => {
      log.silly('Informações da stream %O', description.StreamLabel)
      log.debug('Status da stream %s: %s', description.StreamLabel, description.StreamStatus)
      log.silly('Stream %s shards: %O', description.StreamLabel, description.Shards)

      const toProcess = this.getClosedShard({ lastResult, description })

      if (!toProcess) {
        log.info('Todos os shards para a stream %s fechados já foram processados!', description.StreamLabel)
        return null
      }

      const recordsRaw = await this.getShardRecords({ description, shard: toProcess })
      const formmated = recordsRaw.map(record => {
        const parsed = this.parser.formatOut(record.dynamodb.NewImage)
        parsed.eventName = record.eventName
        return parsed
      })

      return {
        description,
        shard: toProcess,
        records: formmated,
        lastProcessed: toProcess.ShardId,
        processed: this.processedShards({ lastResult, stream: description.StreamLabel })
          .concat([{
            shard: toProcess.ShardId,
            total: formmated.length
          }])
      }
    })

    const results = await Promise.all(dataP)

    return results.filter(r => r).reduce((acc, atual) => {
      acc.push({
        itens: atual.records,
        naming: atual.shard.ShardId,
        label: atual.description.StreamLabel,
        lastProcessed: atual.lastProcessed,
        processed: atual.processed
      })

      return acc
    }, [])
  }

  getDynamoDbStreamsAPI () {
    if (!this.streamsAPI) {
      this.streamsAPI = new AWS.DynamoDBStreams()
    }

    return this.streamsAPI
  }

  async getStreamsForTable (tableName) {
    const streamsAPI = await this.getDynamoDbStreamsAPI()

    const tableStreams = await streamsAPI
      .listStreams({ TableName: tableName })
      .promise()

    log.silly('Streams para a tabela %s: %O', tableName, tableStreams)
    if (!tableStreams.Streams.length) throw new Error('Bucket %s não tem streams associado a ele!', tableName)

    return tableStreams.Streams
  }

  async describeStream (stream) {
    log.debug('Pegando informações sobre a stream %s', stream.StreamLabel)
    const streamsAPI = await this.getDynamoDbStreamsAPI()

    const describe = await streamsAPI
      .describeStream({ StreamArn: stream.StreamArn })
      .promise()

    return describe.StreamDescription
  }

  processedShards ({ lastResult, stream }) {
    if (!lastResult[stream] || !lastResult[stream].processed) return []
    return lastResult[stream].processed
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

  insertData (data) {
    throw new Error('Método não implementado')
  }
}

module.exports = Dynamodb
