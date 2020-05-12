const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

/**
 * Cria um logger
 * @param {String} module O nome do módulo que está chamando
 */

module.exports = module => createLogger({
  level: 'info',
  format: combine(
    label({ label: module }),
    timestamp(),
    customFormat
  ),
  defaultMeta: {
    module: module
  },
  transports: [
    new transports.Console(),

    new transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),

    new transports.File({
      filename: 'logs/combined.log'
    })
  ]
})
