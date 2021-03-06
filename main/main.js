'use strict';
const WizzApi = require('../main/wizz-api.js');
const wizzApi = new WizzApi(); 
const DdbApi = require('../main/ddb-api.js');
let ddbApi; 
const Logger = require('../main/logger.js');
const logger = Logger('main');

// logger.level = 'debug';
// logger.info('Hello world');
// logger.debug('Debugging info');

class Main {
  constructor(ddbEndpoint = 'http://dynamodb.eu-west-1.amazonaws.com') {
    ddbApi = new DdbApi(ddbEndpoint);
  }

  getAndStorePrices (departure, arrival,  dateFrom, dateTo) {
    return wizzApi.getAndPopulatePricesPeriod(departure, arrival,  dateFrom, dateTo)
    .then((pricesPeriodMap) => {
      if (!pricesPeriodMap.size) console.log('no items to process')
      if (!pricesPeriodMap.size) return 'no items to process';
      let timestamp = new Date().getTime();
      let flightPriceEntries = [],
        flightDayTimeEntries = [];

      pricesPeriodMap.forEach((dayPricesMap, day) => {
        let dayTime = Array.from( dayPricesMap.keys() );
        flightDayTimeEntries.push({
          dep: departure,
          arr: arrival,
          flightDay: day,
          flightDayTime: dayTime
        });

        dayPricesMap.forEach((price, dayTime) => {
          flightPriceEntries.push({
            dep: departure,
            arr: arrival,
            flightTime: dayTime,
            parseTimestamp: timestamp,
            price: price
          });
        });
      });

      let flightDayTimeBatchPromise = ddbApi.insertFlightDayTimeBatch(copyObj(flightDayTimeEntries));
      let flightPriceBatchPromise = ddbApi.insertFlightPriceBatch(flightPriceEntries);

      return Promise.all([flightPriceBatchPromise, flightDayTimeBatchPromise]);
    })
    .catch((e) => {
      if (e.message === 'Bad statusCode error: 404') {
        return wizzApi.updateApiVersionUrl();
      } else if (e.message === 'Bad statusCode error: 403') {
        //return wizzApi.updateApiVersionUrl();
      } else {
        throw e;
      }
    });
  }

  getWizzApiInstance () {
    return wizzApi;
  }
}

function copyObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = Main;