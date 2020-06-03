const OS = require('../utils/Os')
const FileSystem = require('../utils/FileSystem')
const StreamResource = require('./StreamResource')
const log = require('../logger')(__filename)

class StreamHdfs extends StreamResource {
  shellCommand (table, outName, osFilePath) {
    // full path
    const hdfsPath = `${this.config.hdfs.writePath}/${table}/${outName}`
    log.debug('Salvando arquivo no path %s', hdfsPath)

    return `hdfs dfs -put -f ${osFilePath} ${hdfsPath}`
  }

  async insertData ({ data, outName, bucket, append }) {
    const osPath = `/tmp/${bucket.name}/${outName}`

    // file exists
    const exists = await FileSystem.exists(osPath)
    log.silly('Objeto sendo gravado %O', data)

    const outData = data.map(item => JSON.stringify(item)).join('\n')

    // espera escrever o arquivo no SO
    const promise = append && exists
      ? FileSystem.append(osPath, outData)
      : FileSystem.write(osPath, outData)

    await promise
    await OS.run(this.shellCommand(bucket.name, outName, osPath))

    // remove o arquivo temporário do so
    return FileSystem.delete(osPath)
  }
}

module.exports = StreamHdfs
