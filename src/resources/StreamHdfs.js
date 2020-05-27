const WebHDFS = require('webhdfs')
const StreamResource = require('./StreamResource')
const log = require('../logger')(__filename)

const { Readable } = require('stream')

class StreamHdfs extends StreamResource {
  constructor (config, parser) {
    super(config, parser)

    log.debug('Configurações do HDFS: %O', this.config.hdfs)
    this.client = WebHDFS.createClient(this.config.hdfs)
  }

  async insertData ({ data, outName, bucket, append }) {
    // full path
    const path = `${this.config.hdfs.writePath}/${bucket.name}/${outName}`

    // file exists
    const exists = new Promise((resolve, reject) => this.client.exists(path, resolve))

    log.debug('Salvando arquivo no path %s', path)
    log.silly('Objeto sendo gravado %O', data)

    const remoteFileStream = this.client.createWriteStream(path, append && exists)
    const readable = Readable.from(data.map(item => JSON.stringify(item)).join('\n'))

    readable.pipe(remoteFileStream)

    return new Promise((resolve, reject) => {
      remoteFileStream.on('error', reject)
      remoteFileStream.on('finish', resolve)
    })
  }
}

module.exports = StreamHdfs
