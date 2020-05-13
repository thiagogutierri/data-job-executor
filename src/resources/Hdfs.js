const WebHDFS = require('webhdfs')
const Resource = require('./Resource')
const log = require('../logger')(__filename)

const { Readable } = require('stream')

class Hdfs extends Resource {
  constructor (config, parser) {
    super(config, parser)

    log.debug('Configurações do HDFS: %O', this.config.hdfs)
    this.client = WebHDFS.createClient(this.config.hdfs)
  }

  getFullData () {
    throw new Error('Método não implementado')
  }

  getPartialData () {
    throw new Error('Método não implementado')
  }

  insertData ({ data, outName, bucket }) {
    return true

    // const path = `${this.config.hdfs.writePath}/${bucket.name}/${outName}`

    // log.debug('Salvando arquivo no path %s', path)
    // log.silly('Objeto sendo gravado %O', data)

    // const remoteFileStream = this.client.createWriteStream(path)
    // Readable.from(JSON.stringify(data)).pipe(remoteFileStream)

    // return new Promise((resolve, reject) => {
    //   remoteFileStream.on('error', reject)
    //   remoteFileStream.on('finish', resolve)
    // })
  }
}

module.exports = Hdfs
