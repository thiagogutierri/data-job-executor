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

  static N (data, path, obj) {
    log.silly('Parseando number: %s, %O, %O', path, data, obj)
    data[path] = Number(obj.N)
  }

  static S (data, path, obj) {
    log.silly('Parseando string: %s, %O, %O', path, data, obj)
    data[path] = String(obj.S)
  }

  static M (data, path, obj) {
    log.silly('Parseando map: %s, %O, %O', path, data, obj)

    Object.keys(obj.M).forEach(key =>
      Object.keys(obj.M[key]).forEach(f => {
        if (!(typeof this[f] === 'function')) {
          throw new Error(`Parâmetro ${JSON.stringify(f)} desconhecido`)
        }

        const rPath = path ? `${path}_${key}` : key
        this[f](data, rPath, obj.M[key])
      })
    )
  }
}

module.exports = Aws
