# Data Job Executor

Move dados de um recurso para outro de tempos em tempos fazendo as conversões necessárias.

## Getting Started

Para utilizar esse projeto bastar ter instalado na máquina nodejs e npm. Caso utilize alguma coisa da AWS será necessário configurar access_key e access_key_secret para o acesso as APIs.

### Installing

Para instalar as dependencias abra um terminal, vá até o diretório deste README (raiz do projeto) e execute:

```
npm i
```

## Running the tests

Na raiz do projeto, execute:

```
npm run test
```

## Deployment

Para executar a aplicação com seus valores default basta executar:

```
npm run start
```

## Configuração extra

É possível de se alterar o comportamento da aplicação alterando variaveis de ambiente e arquivos de configuração.

### Variaveis de ambiente

* **JOB** - Diz para o tipo de job que deve ser agendado para que execute de tempos em tempos. Valor padrão: DataCopy.
* **SCHEDULER** - O tipo de agendamento que será feita para os trabalhos. Valor padrão: Cron.
* **SCHEDULER_INTERVAL** - Diz de quanto em quanto tempo o job executará (notação específica para cada scheduler). Valor padrão: * * * * *.
* **LOG_LEVEL** - O nível de log em que a aplicação rodará. Valor padrão: debug.
* **LOG_ERROR_PATH** - O caminho com o nome do arquivo de log de erro. Valor padrão: logs/error.log.
* **LOG_PATH** - O caminho com o nome do arquivo de log. Valor padrão: logs/app.log.
* **DATA_FORMATTER** - Como a aplicação deverá formatar o dado que vem do recurso externo. Valor padrão: formatter (não faz nada).
* **RESOURCE_CONFIG_PATH** - O caminho do arquivo json que conterá as configurações necessárias para que o recurso externo funcione. Valor padrão: configuration.
* **JOB_CONFIG_PATH** - O caminho do arquivo json que conterá as configurações necessárias para que o job funcione. Valor padrão: configuration.

### Arquivo de configuração

O arquivo de configuração padrão para que a aplicação funcione está localizado em configuration/index.json. Caso queira especificar um arquivo alternativo consulte como na lista acima.

## Arquitetura

Um diagrama de classe foi anexado na raiz do projeto contendo a arquitetura da aplicação.
