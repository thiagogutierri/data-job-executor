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
      },
      lista: {
        SS: ['a', 'b', 'c']
      },
      lista2: {
        NS: [1, 2, 3]
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
      veiculo_placa: 'AWK0012',
      'veiculo_lista[0]': 'a',
      'veiculo_lista[1]': 'b',
      'veiculo_lista[2]': 'c',
      'veiculo_lista2[0]': '1',
      'veiculo_lista2[1]': '2',
      'veiculo_lista2[2]': '3'
    }

    assert.deepEqual(AwsFormatter.formatOut(sampleData), expected)
  })
})
