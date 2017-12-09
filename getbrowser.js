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

wizzApi.getCookie().then(console.log).catch(console.log);
