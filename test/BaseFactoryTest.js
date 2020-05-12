const assert = require('assert')
const BaseFac = require('../src/factory/BaseFac')

describe('Carregamento de módulos dinamicamente', () => {
  it('Deve carregar o módulo index.js', () => {
    assert.doesNotThrow(() => BaseFac.get('../index.js'))
  })
})
