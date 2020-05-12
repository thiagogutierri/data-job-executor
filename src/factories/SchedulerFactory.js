const BaseFac = require('./BaseFac')

const { capitalizeFirst } = require('../utils')

const SCHEDULER_ROOT_PATH = process.env.SCHEDULER_ROOT_PATH || '../schedulers'

class SchedulerFactory extends BaseFac {
  /**
   * Cria um objeto da classe Scheduler baseado em um texto
   * @param {*} type O nome do scheduler
   */

  static get (type) {
    return super.get(`${SCHEDULER_ROOT_PATH}/${capitalizeFirst(type)}`)
  }
}

module.exports = SchedulerFactory
