'use strict';
const Main = require('./main/main.js');
const env = process.env.NODE_ENV || 'production';
const main = env === 'production' ? new Main() : new Main('http://localhost:8000');
const wizzApi = main.getWizzApiInstance(); 
const Logger = require('./main/logger.js');
const logger = Logger('app');

// (async () => {
//   while(true) {
//     await makeOneRotation()
//     .then(() => {
//       logger.info('Successfully finished a rotation.');
//     })
//     .catch((e) => {
//       logger.error('Failed rotation: ', e)
//     });
//   }
// })();

// 2 Rotation a day, every 12 hour
Promise.all([makeOneRotation(), timeout(1000*60*60*12)])
.then(() => {
  logger.info('Successfully finished a rotation.');
})
.catch((e) => {
  logger.error('Failed rotation: ', e)
});

async function makeOneRotation() {
  const map = await wizzApi.getMap();
  logger.info('Successfully extracted a new map.');
  let counter = 1;

  for (let depObj of map) {
    const departure = depObj.iata;

    for (let arrObj of depObj.connections) {
      const arrival = arrObj.iata;
      const oneDayInMillisec = 24 * 60 * 60 * 1000;
      const reqPeriod = 60; // days
      let months = 6;
      const now = new Date();

      for(let month = 0; month < months; month++) {
	if (counter++ % 360 == 0) { // Update cookie every hour
		wizzApi.updateCookie();
	}
	
        const depDateFrom = new Date(now.getTime() + month * 30 * oneDayInMillisec).toISOString().split('T')[0];
        const depDateTo = new Date(now.getTime() + (month + 1) * 30 * oneDayInMillisec).toISOString().split('T')[0];
        try {
          await Promise.all( // Slow down requests to avoid DynamoDB throttling
		  [main.getAndStorePrices(departure, arrival, depDateFrom, depDateTo),
		  timeout(1000)]);
          logger.info('Successfully extracted and stored data for: ', departure, arrival, depDateFrom, depDateTo);
        } catch(e) {
          logger.error('Error on exctracting data for: ', departure, arrival, depDateFrom, depDateTo, e);
        }
      }
    }
  }

  return true;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
