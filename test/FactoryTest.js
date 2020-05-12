const assert = require('assert')
const BaseFac = require('../src/factories/BaseFac')
const SchedulerFactory = require('../src/factories/SchedulerFactory')

describe('Carregamento de módulos dinamicamente', () => {
  it('Deve carregar o módulo index.js', () => {
    assert.doesNotThrow(() => BaseFac.get('../index.js'))
  })

  it('Deve carregar um scheduler específico', () => {
    const Scheduler = SchedulerFactory.get('Scheduler')
    assert.throws(() => Scheduler.get(undefined, undefined))
  })
})
