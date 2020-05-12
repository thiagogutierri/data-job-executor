const assert = require('assert')
const FileConfigSource = require('../src/jobs/config/FileConfigSource')

describe('Carregamento de arquivos de configuração', () => {
  it('Deve carregar o arquivo testConfig.json', () => {
    const config = new FileConfigSource(`${__dirname}/testConfig.json`)
    assert.equal(config.configuration.this.is.a.test, true)
  })
})
