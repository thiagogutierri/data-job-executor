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
        log.debug('Requisitando nova página de scan!')
        const options = { TableName: bucket.name, ExclusiveStartKey: undefined }
        const scan = await dynamo.scan(options).promise()

        scaneados += scan.ScannedCount
        log.debug('Itens scaneados até o momento %s', scaneados)

        const formatado = scan.Items
          .map(item => that.parser.formatOut(item))

        log.debug('Quantidade de itens formatados %s', formatado.length)
        const buff = Buffer.from(JSON.stringify(formatado))

        log.debug('Buffer a ser enviado %O', buff)

        // envia parte para o processo que ta escutando
        this.push(buff)
        lastEvaluatedKey = scan.LastEvaluatedKey
      }
    })

    return { inStream, label: 'full-scan' }
  }
}

module.exports = StreamDynamodb
