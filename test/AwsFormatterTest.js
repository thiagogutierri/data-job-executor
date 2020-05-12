const assert = require('assert')
const AwsFormatter = require('../src/formatters/Aws')

const sampleData = {
  bloqueio: {
    N: '0'
  },
  dataAtualizacao: {
    S: '2020-04-09T15:53:26.582Z'
  },
  veiculo: {
    M: {
      categoria: {
        S: 'DOIS_EIXOS_RODAGEM_SIMPLES'
      },
      placa: {
        S: 'AWK0012'
      }
    }
  }
}

describe('Formatação de dados', () => {
  it('Deve retornar o mesmo que enviei', () => {
    assert.equal(AwsFormatter.formatIn(sampleData), sampleData)
  })

  it('Deve retornar formatado', () => {
    const expected = {
      bloqueio: 0,
      dataAtualizacao: '2020-04-09T15:53:26.582Z',
      veiculo_categoria: 'DOIS_EIXOS_RODAGEM_SIMPLES',
      veiculo_placa: 'AWK0012'
    }

    assert.deepEqual(AwsFormatter.formatOut(sampleData), expected)
  })
})
