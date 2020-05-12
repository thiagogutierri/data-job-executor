const BaseFac = require('./BaseFac')
const FileConfigSource = require('../jobs/config/FileConfigSource')

const { capitalizeFirst } = require('../utils')

const JOB_ROOT_PATH = process.env.JOB_ROOT_PATH || '../jobs'
const JOB_CONFIG_PATH = process.env.JOB_CONFIG_PATH || `${__dirname}/../../configuration/index.json`

class JobFactory extends BaseFac {
  /**
   * Cria um objeto da classe job baseado em um texto
   * @param {*} type O nome do job
   */

  static get (type) {
    const Job = super.get(`${JOB_ROOT_PATH}/${capitalizeFirst(type)}`)
    return new Job(new FileConfigSource(JOB_CONFIG_PATH))
  }
}

module.exports = JobFactory
