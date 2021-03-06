const BaseFac = require('./BaseFac')
const FileConfigSource = require('../jobs/config/FileConfigSource')

const { capitalizeFirst } = require('../utils')

const RESOURCE_ROOT_PATH = process.env.RESOURCE_ROOT_PATH || '../resources'
const FORMATTER_ROOT_PATH = process.env.FORMATTER_ROOT_PATH || '../formatters'
const RESOURCE_CONFIG_PATH = process.env.RESOURCE_CONFIG_PATH || `${__dirname}/../../configuration/index.json`

class ResourceFactory extends BaseFac {
  /**
   * Cria um objeto da classe job baseado em um texto
   * @param {*} type O nome do job
   */

  static get (type) {
    const Resource = super.get(`${RESOURCE_ROOT_PATH}/${capitalizeFirst(type)}`)

    const dataFormatter = process.env.DATA_FORMATTER || 'formatter'
    const Formatter = super.get(`${FORMATTER_ROOT_PATH}/${capitalizeFirst(dataFormatter)}`)

    return new Resource(new FileConfigSource(RESOURCE_CONFIG_PATH).configuration, Formatter)
  }

  static getWithFormatter (type, formatter) {
    const Resource = super.get(`${RESOURCE_ROOT_PATH}/${capitalizeFirst(type)}`)
    return new Resource(new FileConfigSource(RESOURCE_CONFIG_PATH), formatter)
  }
}

module.exports = ResourceFactory
