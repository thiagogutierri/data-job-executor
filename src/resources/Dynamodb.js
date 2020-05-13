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

  getFullData ({ bucket }) {
    if (!bucket) throw new Error('Parâmetro bucket é obrigatório!')

    const dynamo = new AWS.DynamoDB()
    const params = {
      TableName: bucket
    }

    log.debug('Scaneando a tabela %s', bucket)

    return new Promise((resolve, reject) => dynamo.scan(params, (err, data) => {
      if (err) {
        log.error('Erro no scan %O', err)
        return reject(err)
      }

      log.debug('Tabela do dynamo scaneada!')
      log.debug('Total de itens %s', data.Count)
      log.debug('Total de itens scaneados %s', data.ScannedCount)

      // não usar a forma contrata do map se não o parser perde a referencia do this
      const itens = data.Items.map(item => this.parser.formatOut(item))

      resolve({
        itens: [{
          records: itens
        }],
        total: data.Count
      })
    }))
  }

  /**
   * Pega ultimas alterações de uma tabela baseado em uma table stream
   */

  async getPartialData ({ bucket, lastResult }) {
    log.debug('Last bucket result %O', lastResult)
    log.info('Processando streams para o bucket %s', bucket)

    const dynamodbstreams = new AWS.DynamoDBStreams()
    const tableStreams = await dynamodbstreams.listStreams({ TableName: bucket }).promise()

    if (!tableStreams.Streams.length) throw new Error('Bucket %s não tem streams associado a ele!', bucket)

    // uma tabela pode ter mais de uma stream associada a ela
    const pStreamDescribe = tableStreams.Streams.map(async stream => {
      log.debug('Pegando informações sobre a stream %s', stream.StreamLabel)
      const describe = await dynamodbstreams.describeStream({ StreamArn: stream.StreamArn }).promise()
      return describe.StreamDescription
    })

    const streamDescribe = await Promise.all(pStreamDescribe)
    const shardPromises = streamDescribe.map(async stream => {
      log.silly('Informações da stream %O', stream.StreamLabel)
      log.debug('Status da stream %s: %s', stream.StreamLabel, stream.StreamStatus)
      log.silly('Stream %s shards: %O', stream.StreamLabel, stream.Shards)

      // pega o último shard id processado para essa stream
      let lastShardId
      if (lastResult[stream.StreamLabel]) {
        lastShardId = lastResult[stream.StreamLabel].shard.ShardId
      }

      // pega os shards
      const lastIndex = stream.Shards.findIndex(shard => shard.ShardId === lastShardId)
      const index = lastIndex === stream.Shards.length - 1
        // se o último processado é o último shard da stream, continua nele
        ? lastIndex
        // se não pega o próximo
        : lastIndex + 1

      const currentShard = stream.Shards[index]

      // shard iterator
      const shardIterator = await dynamodbstreams.getShardIterator({
        ShardId: currentShard.ShardId,
        ShardIteratorType: 'TRIM_HORIZON',
        StreamArn: stream.StreamArn
      }).promise()

      log.debug('Shard %s iterator %O', currentShard.ShardId, shardIterator.ShardIterator)
      const records = await dynamodbstreams.getRecords({ ShardIterator: shardIterator.ShardIterator }).promise()
      return {
        stream,
        currentShard,
        records: records.Records
      }
    })

    const shards = await Promise.all(shardPromises)

    return shards.map(shard => {
      shard.records = shard.records.map(item => this.parser.formatOut(item))
      return shard
    }).reduce((acc, atual) => {
      acc.push({
        label: atual.stream.StreamLabel,
        itens: atual.records,
        naming: atual.currentShard.ShardId,
        shard: atual.currentShard,
        total: atual.records.length
      })

      return acc
    }, [{
      itens: [],
      total: 0
    }])
  }

  insertData (data) {
    throw new Error('Método não implementado')
  }
}

module.exports = Dynamodb
