'use strict';
let chai = require('chai');
chai
    .use(require('chai-as-promised'))
    .use(require('chai-json-schema'));
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;
let WizzApi = require('../main/wizz-api.js');
let wizzApi = new WizzApi(); 
let DdbApi = require('../main/ddb-api.js');
let ddbApi = new DdbApi('http://localhost:8000'); 
let Main = require('../main/main.js');
let main = new Main('http://localhost:8000');

describe('Main ', function() {
  this.timeout(40000);
  describe.skip('getAndStorePrices: ', function() {
    it('Request for 30 days and insert in DB:', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 1 * oneDayInMillisec).toISOString().split('T')[0],
          dateTo = new Date(now.getTime() + 30 * oneDayInMillisec).toISOString().split('T')[0],
          departure = 'OTP',
          arrival = 'CIA';

      let getAndStorePricesPromise = main.getAndStorePrices(departure, arrival,  dateFrom, dateTo),
        ddbResponse,
        checkDbPromise = getAndStorePricesPromise
        .then((r) => {
          ddbResponse = r;
          return Promise.all([ddbApi.getSize('FlightTime'), ddbApi.getSize('FlightPrices')]);
        })
        .then((dbSizes) => {
          assert.strictEqual(dbSizes[0], 30, 'exactly 30 items in FlightTime table');
          assert.isAtLeast(dbSizes[1], 30, 'at least 30 itmes in FlightPrices table');
          return ddbResponse;
        });

      return expect(checkDbPromise.catch((e) => {throw e;})).to.eventually.deep.equal([{ UnprocessedItems: {} }, { UnprocessedItems: {} }]);
    });

    it('Request for no connection flight and return no items to process msg:', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 1 * oneDayInMillisec).toISOString().split('T')[0],
          dateTo = new Date(now.getTime() + 30 * oneDayInMillisec).toISOString().split('T')[0],
          departure = 'IAS',
          arrival = 'KIV';

      let getAndStorePricesPromise = main.getAndStorePrices(departure, arrival,  dateFrom, dateTo),
        ddbResponse,
        checkDbPromise = getAndStorePricesPromise
        .then((r) => {
          ddbResponse = r;
          return Promise.all([ddbApi.getSize('FlightTime'), ddbApi.getSize('FlightPrices')]);
        })
        .then((dbSizes) => {
          assert.strictEqual(dbSizes[0], 0, 'exactly 0 items in FlightTime table');
          assert.strictEqual(dbSizes[1], 0, 'exactly 0 itmes in FlightPrices table');
          return ddbResponse;
        });

      return expect(checkDbPromise.catch((e) => {throw e;})).to.eventually.deep.equal('no items to process');
    });

    beforeEach(function(done) {
      Promise.all([ddbApi.createTableFlightPrices(), ddbApi.createTableFlightTime()])
        .then(function(data) {
          printInfo('FlightPrices and FlightTime table created');
          done();
        })
        .catch(function(err) {
          printInfo('Error creating FlightPrices or FlightTime');
          done();
        });
    });
    afterEach(function(done) {
      ddbApi.deleteAllTables(done);
    });
  });

  describe('getAndStorePrices fail first time with wizzApi and succeed the second: ', function() {
    it('Request for 3 days and insert in DB and fail and on retry succeed:', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 1 * oneDayInMillisec).toISOString().split('T')[0],
          dateTo = new Date(now.getTime() + 3 * oneDayInMillisec).toISOString().split('T')[0],
          departure = 'OTP',
          arrival = 'CIA';

      let getAndStorePricesPromise = 
          main.getAndStorePrices(departure, arrival,  dateFrom, dateTo)      
            .then(() => {
              return main.getAndStorePrices(departure, arrival,  dateFrom, dateTo)
            });

      return expect(getAndStorePricesPromise.catch((e) => {throw e;})).to.eventually.deep.equal([{ UnprocessedItems: {} }, { UnprocessedItems: {} }]);
    });

    beforeEach(function(done) {
      let getApiPromise = wizzApi.getApiVersionUrl()
      .then(() => {
        main.getWizzApiInstance().apiUrl = 'https://be.wizzair.com/6.0.0/Api';
        printInfo('apiUrl set to https://be.wizzair.com/6.0.0/Api');
      }).catch((err) => {
        throw new Error('Failed to getApiVersionUrl.');
      });

      Promise.all([ddbApi.createTableFlightPrices(), ddbApi.createTableFlightTime(), getApiPromise])
        .then(function(data) {
          printInfo('FlightPrices and FlightTime table created');
          done();
        })
        .catch(function(err) {
          throw new Error('Error creating FlightPrices or FlightTime');
          done();
        });
    });
    afterEach(function(done) {
      wizzApi.updateApiVersionUrl();
      ddbApi.deleteAllTables(done);
    });
  });
});

function printInfo(msg) {
  console.log('\x1b[36m%s\x1b[0m', '      ' + msg); 
}