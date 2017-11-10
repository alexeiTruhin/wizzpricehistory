const Main = require('./main/main.js');
const env = process.env.NODE_ENV || 'development';
const main = env === 'development' ? new Main('http://localhost:8000') : new Main();
const wizzApi = main.getWizzApiInstance(); 
const Logger = require('./main/logger.js');
const logger = Logger('app');

(async () => {
  const map = await wizzApi.getMap();
  logger.info('Successfully extracted a new map.');

  for (let depObj of map) {
    const departure = depObj.iata;

    for (let arrObj of depObj.connections) {
      const arrival = arrObj.iata;
      const oneDayInMillisec = 24 * 60 * 60 * 1000;
      const reqPeriod = 60; // days
      let months = 6;
      const now = new Date();

      for(let month = 0; month < months; month++) {
        const depDateFrom = new Date(now.getTime() + month * 30 * oneDayInMillisec).toISOString().split('T')[0];
        const depDateTo = new Date(now.getTime() + (month + 1) * 30 * oneDayInMillisec).toISOString().split('T')[0];
        try {
          await main.getAndStorePrices(departure, arrival, depDateFrom, depDateTo);
          logger.info('Successfully extracted and stored data for: ', departure, arrival, depDateFrom, depDateTo);
        } catch(e) {
          logger.error('Error on exctracting data for: ', departure, arrival, depDateFrom, depDateTo, e);
        }
      }
    }
  }

  return true;
})()
.then(() => {
  logger.info('Successfully finished a rotation.');
})
.catch((e) => {
  logger.error('Failed rotation: ', e)
});
