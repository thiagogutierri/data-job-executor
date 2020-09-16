const log = require('../logger')(__filename)
const Formatter = require('./Formatter')

class Aws extends Formatter {
  static formatIn (data) {
    log.info('Format in não implementado, devolvendo o que recebi! %O', data)
    return data
  }

  static formatOut (data) {
    log.silly('Formatando o dado da AWS %O para o modelo JSON com maps de delimitador: "_"', data)

    const retorno = {}
    this.M(retorno, '', { M: data })

    return retorno
  }

  static getData (data, path) {
    return typeof data[path] === 'undefined' ? data : data[path]
  }

  static N (data, path, obj) {
    log.silly('Parseando number: %s, %O, %O', path, data, obj)
    data[path] = Number(this.getData(obj, 'N'))
  }

  static S (data, path, obj) {
    log.silly('Parseando string: %s, %O, %O', path, data, obj)
    data[path] = String(this.getData(obj, 'S'))
  }

  static B (data, path, obj) {
    log.silly('Parseando binario: %s, %O, %O', path, data, obj)
    data[path] = Buffer.from(this.getData(obj, 'B'), 'binary').toString('base64')
  }

  static SS (data, path, obj) {
    log.silly('Parseando string set: %s, %O, %O', path, data, obj)
    obj.SS.forEach((s, index) => this.S(data, `${path}[${index}]`, s))
  }

  static NS (data, path, obj) {
    log.silly('Parseando number set: %s, %O, %O', path, data, obj)
    obj.NS.forEach((n, index) => this.N(data, `${path}[${index}]`, n))
  }

  static BS (data, path, obj) {
    log.silly('Parseando binary set: %s, %O, %O', path, data, obj)
    obj.BS.forEach((b, index) => this.B(data, `${path}[${index}]`, b))
  }

  static L (data, path, obj) {
    log.silly('Parseando list: %s, %O, %O', path, data, obj)
    obj.L.forEach((m, index) => this.ARRAY(data, `${path}[${index}]`, m))
  }

  static NULL (data, path, obj) {
    log.silly('Parseando null: %s, %O, %O', path, data, obj)
    data[path] = null
  }

  static BOOL (data, path, obj) {
    log.silly('Parseando boolean: %s, %O, %O', path, data, obj)
    data[path] = obj === 'true'
  }

  static M (data, path, obj) {
    log.silly('JSON Plan: %s', JSON.stringify(obj))
    log.silly('Parseando map: %s, %O, %O', path, data, obj)
    Object.keys(obj.M).forEach(key => {
      log.silly('forEach key(%s)/value(%s)', key, obj.M[key])
      return Object.keys(obj.M[key]).forEach(f => {
        if (!(typeof this[f] === 'function')) {
          throw new Error(`Parâmetro ${JSON.stringify(f)} desconhecido`)
        }
        const rPath = path ? `${path}_${key}` : key
        this[f](data, rPath, obj.M[key])
      })
    }
    )
  }

  static ARRAY (data, path, obj) {
    log.silly('JSON Plan: %s', JSON.stringify(obj))
    log.silly('Parseando map: %s, %O, %O', path, data, obj)
    Object.keys(obj).forEach(key => {
      log.silly('forEach key(%s)/value(%s)', key, obj.M[key])
      return Object.keys(obj[key]).forEach(f => {
        if (!(typeof this[f] === 'function')) {
          throw new Error(`Parâmetro ${JSON.stringify(f)} desconhecido`)
        }
        const rPath = path ? `${path}_${key}` : key
        this[f](data, rPath, obj.M[key])
      })
    }
    )
  }
}

module.exports = Aws
