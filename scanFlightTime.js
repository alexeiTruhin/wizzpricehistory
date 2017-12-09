'use strict';
const DdbApi = require('./main/ddb-api.js');
const env = process.env.NODE_ENV || 'production';
const ddbApi = env === 'production' ? new DdbApi() : new DdbApi('http://localhost:8000');
const Logger = require('./main/logger.js');
const logger = Logger('createTables');

scanAndCopy()
.then(() => {
  logger.info('Successfully Copied From FlightTime to FlightDayTime.');
})
.catch((e) => {
  logger.error('Failed to copy: ', e)
});

async function scanAndCopy() {
  let limit = 30;
  let response = await ddbApi.scan('FlightTime', limit);
  let lastEvaluatedKey = response.LastEvaluatedKey;
  console.log(lastEvaluatedKey);
  await processResponse(response);

  while(lastEvaluatedKey) {
    response = await ddbApi.scan('FlightTime', limit, lastEvaluatedKey);
    lastEvaluatedKey = response.LastEvaluatedKey;
    console.log(lastEvaluatedKey);
    await Promise.all([processResponse(copyObj(response)), (new Promise(resolve => setTimeout(resolve, 1000)))]);
  }
}

function processResponse(response) {
  if (!response['Items'] || !response['Items'].length) return Promise.resolve();
  let flightDayTimeEntries = [];

  response['Items'].forEach((item) => {
    let flightDay = item.FlightDay.split('|');
    if (flightDay[2].includes('2017-11-')) {
      flightDayTimeEntries.push({
        dep: flightDay[0],
        arr: flightDay[1],
        flightDay: flightDay[2],
        flightDayTime: item.FlightDayTime
      });
    }
  });

  return ddbApi.insertFlightDayTimeBatch(copyObj(flightDayTimeEntries));;
}

function copyObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}