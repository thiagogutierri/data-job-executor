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
        itens,
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
      log.debug('Describe result', describe)
      return describe
    })

    const streamDescribe = await Promise.all(pStreamDescribe)
    streamDescribe.map(stream => {
      log.silly('Informações da stream %O', stream.StreamLabel)
      log.debug('Status da stream %s: %s', stream.StreamLabel, stream.StreamStatus)

      log.debug('Stream %s shards: %O', stream.StreamLabel, stream.Shards)
      // pega os shards
    })

    throw new Error('Não implementado')
  }

  insertData (data) {
    throw new Error('Método não implementado')
  }
}

module.exports = Dynamodb
