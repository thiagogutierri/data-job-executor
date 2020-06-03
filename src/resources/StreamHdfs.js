const OS = require('../utils/Os')
const FileSystem = require('../utils/FileSystem')
const StreamResource = require('./StreamResource')
const log = require('../logger')(__filename)

class StreamHdfs extends StreamResource {
  createHdfsFilePath (table) {
    return `hdfs dfs -mkdir -p ${this.config.hdfs.writePath}/${table}`
  }

  shellCommand (table, outName, osFilePath) {
    // full path
    const hdfsPath = `${this.config.hdfs.writePath}/${table}/${outName}`
    log.debug('Salvando arquivo no path %s', hdfsPath)

    return `hdfs dfs -put -f ${osFilePath} ${hdfsPath}`
  }

  async insertData ({ data, outName, bucket, append, flush }) {
    const osPath = `/tmp/${bucket.name}_${outName}`

    // file exists
    const exists = await FileSystem.exists(osPath)
    log.silly('Objeto sendo gravado %O', data)

    const outData = data.map(item => JSON.stringify(item)).join('\n')

    // espera escrever o arquivo no SO
    const promise = append && exists
      ? FileSystem.append(outData, osPath)
      : FileSystem.write(outData, osPath)

    await promise

    // Salva no hdfs quando não estiver fazendo mais append
    if (flush) {
      log.debug('Fazendo flush para o HDFS')
      try {
        // certificando que o path no hdfs está criado
        await OS.run(this.createHdfsFilePath(bucket.name))
        await OS.run(this.shellCommand(bucket.name, outName, osPath))
      } finally {
        await FileSystem.delete(osPath)
      }
    }

    return Promise.resolve(true)
  }
}

module.exports = StreamHdfs
