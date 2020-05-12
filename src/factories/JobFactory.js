const BaseFac = require('./BaseFac')
const FileConfigSource = require('../jobs/config/FileConfigSource')

const { capitalizeFirst } = require('../utils')

const JOB_ROOT_PATH = process.env.JOB_ROOT_PATH || '../jobs'

class JobFactory extends BaseFac {
  /**
   * Cria um objeto da classe job baseado em um texto
   * @param {*} type O nome do job
   */

  static get (type) {
    const Job = super.get(`${JOB_ROOT_PATH}/${capitalizeFirst(type)}`)

    // TODO: Permitir parametrização
    return new Job(new FileConfigSource(`${__dirname}/../../configuration/index.json`))
  }
}

module.exports = JobFactory
