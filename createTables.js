'use strict';
const DdbApi = require('./main/ddb-api.js');
const env = process.env.NODE_ENV || 'production';
const ddbApi = env === 'production' ? new DdbApi() : new DdbApi('http://localhost:8000');
const Logger = require('./main/logger.js');
const logger = Logger('createTables');

Promise.all([ddbApi.createTableFlightPrices(), ddbApi.createTableFlightTime(), ddbApi.createTableFlightDayTime()])
  .then((response) => {
    logger.info('FlightPrices and FlightTime tables created');
  })
  .catch((err) => {
    logger.error('Error creating FlightPrices or FlightTime:', err);
  });