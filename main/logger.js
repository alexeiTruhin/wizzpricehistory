'use strict';
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'logs';
//   Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const isoFormat = () => (new Date()).toISOString();

module.exports = (component) => {
  return new (winston.Logger)({
      transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
          timestamp: isoFormat,
          colorize: true,
          level: 'info'
        }),
        new (require('winston-daily-rotate-file'))({
          filename: `${logDir}/-${component}.log`,
          timestamp: isoFormat,
          datePattern: 'yyyy-MM-dd',
          prepend: true,
          level: env === 'development' ? 'debug' : 'info'
        })
      ]
    });
}