const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf, splat } = format

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

/**
 * Cria um logger
 * @param {String} module O nome do módulo que está chamando
 */

module.exports = module => createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    label({ label: module }),
    timestamp(),
    splat(),
    customFormat
  ),
  defaultMeta: {
    module: module
  },
  transports: [
    new transports.Console(),

    new transports.File({
      filename: process.env.LOG_ERROR_PATH || 'logs/error.log',
      level: 'error'
    }),

    new transports.File({
      filename: process.env.LOG_PATH || 'logs/app.log'
    })
  ]
})
