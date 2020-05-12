const logger = require('./logger')(__filename)

logger.info('Olá %O', { teste: true })
