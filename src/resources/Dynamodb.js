const AWS = require('aws-sdk')
const Resource = require('./Resource')
const log = require('../logger')(__filename)

class Dynamodb extends Resource {
  constructor (config, parser) {
    super(config, parser)

    log.debug('Atualizando as configurações da AWS: %O', this.config.configuration.aws)
    AWS.config.update(this.config.configuration.aws)
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
      resolve(data.Items.map(item => this.parser.formatOut(item)))
    }))
  }

  /**
   * Pega ultimas alterações de uma tabela baseado em uma table stream
   */

  getPartialData () {
    log.error('Classe que deveria ser usada como modelo sendo instanciada!')
    throw new Error('Classe modelo não deve ser usada!')
  }

  insertData (data) {
    throw new Error('Método não implementado')
  }
}

module.exports = Dynamodb
