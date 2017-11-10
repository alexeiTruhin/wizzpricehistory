const DdbApi = require('./main/ddb-api.js');
const env = process.env.NODE_ENV || 'development';
const ddbApi = env === 'development' ? new DdbApi('http://localhost:8000') : new DdbApi();
const Logger = require('./main/logger.js');
const logger = Logger('createTables');

Promise.all([ddbApi.createTableFlightPrices(), ddbApi.createTableFlightTime()])
  .then((response) => {
    logger.info('FlightPrices and FlightTime tables created');
  })
  .catch((err) => {
    logger.error('Error creating FlightPrices or FlightTime:', err);
  });