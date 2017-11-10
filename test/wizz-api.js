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

describe('Main: ', function() {
  describe('getApiVersion()', function() {
    it('should return API Version URL', function() {
      return wizzApi.getApiVersionUrl().should.eventually.match(/^https:\/\/be\.wizzair\.com\/(\.|\d)+\/Api/);
    });

    it('should return 404', function() {
      return wizzApi.getApiVersionUrl(false, 'https://wizzair.com/NonExistentURL.json').should.be.rejectedWith(/404/);
    });
  });

  describe.skip('getMap()', function() {
    it('example of promise and jsonSchema', function(done) {
      new Promise(function(resolve, reject) {resolve({a: 2})}).then(function(r) {
        assert.jsonSchema(r, {title: 'map', type: 'object', required: ['a']});
        done();
      }).catch(function(e){done(e);});
    });

    it('should return array of countries', function(done) {
      this.timeout(20000);
      let countriesSchema = {
          title: 'map', 
          type: 'array', 
          minItems: 1,
          uniqueItems: true,
          items: {
            type: 'object',
            required: ['iata', 'connections'],
            properties: {
              iata: {
                type: 'string'
              },
              connections: {
                type: 'array'
              }
            }
          }
        };

      wizzApi.getMap().then(function(r) {
        assert.jsonSchema(r, countriesSchema);
        printInfo('Number of cities: ', r.length);
        done();
      }).catch(function(e){done(e);});
    });
  });

  describe('getPricesDay()', function() {
    this.timeout(20000);
    it.skip('should return a Map object', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          date = new Date(now.getTime() + 7 * oneDayInMillisec),
          departure = 'OTP',
          arrival = 'CIA';

      let m = new Map();

      return expect(wizzApi.getPricesDay(departure, arrival, date)).to.eventually.be.an.instanceof(Map);
    });

    it.skip('should return a Map object with valid jsonSchema', function(done) {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          date = new Date(now.getTime() + 8 * oneDayInMillisec),
          departure = 'OTP',
          arrival = 'CIA',
          pricesDaySchema = {
            title: 'pricesDay', 
            type: 'object', 
            minItems: 0,
            uniqueItems: true,
            items: {
              type: 'object'
            }
          };

      wizzApi.getPricesDay(departure, arrival, date).then(function(r) {
        assert.jsonSchema(r, pricesDaySchema);
        console.log('       Prices ' + departure + '-' + arrival + ' ' + date + ':', r);
        done();
      }).catch(function(e){done(e);});
    });

    it('should return an empty Map', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          date = new Date(now.getTime() + 7 * oneDayInMillisec),
          departure = 'IAS',
          arrival = 'KIV';

      let m = new Map();

      return expect(wizzApi.getPricesDay(departure, arrival, date).catch((e) => console.log(e))).to.eventually.be.an.instanceof(Map);
    });
  });

  describe('getPricesPeriod()', function() {
    this.timeout(20000);
    it.skip('should return a Map', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 3 * oneDayInMillisec),
          dateTo = new Date(now.getTime() + 5 * oneDayInMillisec)
          departure = 'OTP',
          arrival = 'CIA';

      let m = new Map();

      return expect(wizzApi.getPricesPeriod(departure, arrival, dateFrom, dateTo)).to.eventually.be.an.instanceof(Map);
    });

    it.skip('should return a Map with valid jsonSchema', function(done) {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 3 * oneDayInMillisec),
          dateTo = new Date(now.getTime() + 5 * oneDayInMillisec)
          departure = 'OTP',
          arrival = 'CIA',
          pricesPeriodSchema = {
            title: 'pricesPeriod', 
            type: 'object', 
            minItems: 0,
            uniqueItems: true,
            items: {
              type: 'object'
            }
          };

      wizzApi.getPricesPeriod(departure, arrival, dateFrom, dateTo).then(function(r) {
        assert.jsonSchema(r, pricesPeriodSchema);
        printInfo('Prices ' + departure + '-' + arrival + ' ' + dateFrom.toString() + '-' + dateTo.toString() + ':', r);
        done();
      }).catch(function(e){done(e);});
    });

    it('should return an empty Map', function() {

      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 3 * oneDayInMillisec),
          dateTo = new Date(now.getTime() + 5 * oneDayInMillisec),
          departure = 'IAS',
          arrival = 'KIV';

      let m = new Map();

      return expect(wizzApi.getPricesPeriod(departure, arrival, dateFrom, dateTo).catch((e) => console.log(e))).to.eventually.be.an.instanceof(Map);
    });
  });


  describe.skip('populatePricesPeriod()', function() {
    this.timeout(30000);
    it('should return a Map', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 3 * oneDayInMillisec),
          dateTo = new Date(now.getTime() + 5 * oneDayInMillisec)
          departure = 'OTP',
          arrival = 'CIA';

      return expect(wizzApi.getAndPopulatePricesPeriod(departure, arrival,  dateFrom, dateTo)).to.eventually.be.an.instanceof(Map);

    });

    it('should return a Map with distinct prices on days with more than 2 flights', function() {
      let now = new Date(),
          oneDayInMillisec = 24 * 60 * 60 * 1000,
          dateFrom = new Date(now.getTime() + 3 * oneDayInMillisec),
          dateTo = new Date(now.getTime() + 5 * oneDayInMillisec)
          departure = 'OTP',
          arrival = 'CIA';

      let validateData = (pricesPeriodMap) => {
        let valid = true;

        pricesPeriodMap.forEach((pricesPeriodMapValue) => {
          let dayPricesMap = pricesPeriodMapValue;
          if (dayPricesMap.size >= 2) {
            let valueArr = [];
            dayPricesMap.forEach((v) => {
              if (valueArr.indexOf(v) >= 0 ) {
                valid = false;
                return;
              } else {
                valueArr.push(v);
              }
            });
            if (!valid) return;
          }
        });

        if (!valid) return new Error('2 same day flights with same prices');
        return pricesPeriodMap;
      };

      return expect(wizzApi.getAndPopulatePricesPeriod(departure, arrival,  dateFrom, dateTo).then(validateData)).to.eventually.be.an.instanceof(Map);

    });
  });
});

function printInfo(msg) {
  console.log('\x1b[36m%s\x1b[0m', '      ' + msg); 
}
