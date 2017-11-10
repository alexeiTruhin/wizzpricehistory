'use strict';
let chai = require('chai');
chai
    .use(require('chai-as-promised'))
    .use(require('chai-json-schema'));
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;
let DdbApi = require('../main/ddb-api.js');
let ddbApi = new DdbApi('http://localhost:8000'); 

describe('Create table:', function() {
  it('FlightPrices: ', function() {
    return expect(ddbApi.createTableFlightPrices()).to.eventually.have.property('TableDescription');
  });

  it('FlightTime: ', function() {
    return expect(ddbApi.createTableFlightTime()).to.eventually.have.property('TableDescription');
  });

  before(function(done) {
    ddbApi.deleteAllTables(done);
  });

  after(function(done) {
    ddbApi.deleteAllTables(done);
  });
});

describe('Populate table ', function() {
  describe('FlightPrices ', function() {
    it('with one entity: ', function() {
      let flightPriceEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightTime: '2017-10-15T06:05:00',
        parseTimestamp: (new Date()).getTime(),
        price: 142
      };

      return expect(ddbApi.insertFlightPrice(flightPriceEntry)).to.eventually.deep.equal({});
    });

    it('with one entity with parseTimestamp of type string and fail: ', function() {
      let flightPriceEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightTime: '2017-10-15T06:05:00',
        parseTimestamp: (new Date()).getTime() + 'string',
        price: 142
      };

      return expect(ddbApi.insertFlightPrice(flightPriceEntry)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('with string price and fail: ', function() {
      let flightPriceEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightTime: '2017-10-15T06:05:00',
        parseTimestamp: (new Date()).getTime(),
        price: 142 + 'string'
      };

      return expect(ddbApi.insertFlightPrice(flightPriceEntry)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('in batch: ', function() {
      let flightPriceEntries = [
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-15T06:05:00',
          parseTimestamp: (new Date()).getTime(),
          price: 142
        },
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-16T07:50:00',
          parseTimestamp: (new Date()).getTime(),
          price: 152
        },
      ];

      return expect(ddbApi.insertFlightPriceBatch(flightPriceEntries)).to.eventually.deep.equal({ UnprocessedItems: {} });
    });

    it('in batch with string parseTimestamp and fail: ', function() {
      let flightPriceEntries = [
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-15T06:05:00',
          parseTimestamp: (new Date()).getTime(),
          price: 142
        },
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-16T07:50:00',
          parseTimestamp: (new Date()).getTime() + 'sting',
          price: 152
        },
      ];

      return expect(ddbApi.insertFlightPriceBatch(flightPriceEntries)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('in batch with string price and fail: ', function() {
      let flightPriceEntries = [
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-15T06:05:00',
          parseTimestamp: (new Date()).getTime(),
          price: 142
        },
        {
          dep: 'IAS',
          arr: 'LCA',
          flightTime: '2017-10-16T07:50:00',
          parseTimestamp: (new Date()).getTime(),
          price: 152 + 'string'
        }
      ];

      return expect(ddbApi.insertFlightPriceBatch(flightPriceEntries)).to.eventually.be.rejectedWith('Type mismatch');
    });

    before(function(done) {
      ddbApi.createTableFlightPrices()
        .then(function(data) {
          printInfo('FlightPrices table created');
          done();
        })
        .catch(function(err) {
          printInfo('Error creating FlightPrices');
          done();
        });
    });
    after(function(done) {
      ddbApi.deleteAllTables(done);
    });
  });


  describe('FlightTime ', function() {
    it('with one entity: ', function() {
      let flightDayTimeEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-15T00:00:00',
        flightDayTime: ['2017-10-15T06:05:00', '2017-10-15T13:30:00']
      };

      return expect(ddbApi.insertFlightTime(flightDayTimeEntry)).to.eventually.deep.equal({});
    });

    it('with one entity with invalid flightDay and fail: ', function() {
      let flightDayTimeEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-15T00:00:00' + 'string',
        flightDayTime: ['2017-10-15T06:05:00', '2017-10-15T13:30:00']
      };

      return expect(ddbApi.insertFlightTime(flightDayTimeEntry)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('with one entity with invalid flightDayTime and fail: ', function() {
      let flightDayTimeEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-15T00:00:00',
        flightDayTime: ['2017-10-15T06:05:00', '2017-10-15T13:30:00' + 'string']
      };

      return expect(ddbApi.insertFlightTime(flightDayTimeEntry)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('with one entity with invalid flightDayTime and fail v2: ', function() {
      let flightDayTimeEntry = {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-15T00:00:00',
        flightDayTime: '2017-10-15T13:30:00'
      };

      return expect(ddbApi.insertFlightTime(flightDayTimeEntry)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('in batch: ', function() {
      let flightDayTimeEntries = [{
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-16T00:00:00',
        flightDayTime: ['2017-10-16T06:05:00', '2017-10-16T13:30:00']
      },
      {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-17T00:00:00',
        flightDayTime: ['2017-10-17T06:05:00', '2017-10-17T13:30:00']
      }];

      return expect(ddbApi.insertFlightTimeBatch(flightDayTimeEntries)).to.eventually.deep.equal({ UnprocessedItems: {} });
    });

    it('in batch with invalid flightDay and fail: ', function() {
      let flightDayTimeEntries = [{
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-16T00:00:00' + 'string',
        flightDayTime: ['2017-10-16T06:05:00', '2017-10-16T13:30:00']
      },
      {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-17T00:00:00',
        flightDayTime: ['2017-10-17T06:05:00', '2017-10-17T13:30:00']
      }];

      return expect(ddbApi.insertFlightTimeBatch(flightDayTimeEntries)).to.eventually.be.rejectedWith('Type mismatch');
    });

    it('in batch with invalid flightDayTime and fail: ', function() {
      let flightDayTimeEntries = [{
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-16T00:00:00',
        flightDayTime: ['2017-10-16T06:05:00', '2017-10-16T13:30:00']
      },
      {
        dep: 'IAS',
        arr: 'LCA',
        flightDay: '2017-10-17T00:00:00',
        flightDayTime: ['2017-10-17T06:05:00' + 'string', '2017-10-17T13:30:00']
      }];

      return expect(ddbApi.insertFlightTimeBatch(flightDayTimeEntries)).to.eventually.be.rejectedWith('Type mismatch');
    });

    before(function(done) {
      ddbApi.createTableFlightTime()
        .then(function(data) {
          printInfo('FlightTime table created');
          done();
        })
        .catch(function(err) {
          printInfo('Error creating FlightTime');
          done();
        });
    });
    after(function(done) {
      ddbApi.deleteAllTables(done);
    });
  });
});


describe('Get ', function() {
  describe('FlightTime ', function() {
    it('size: ', function() {
      return expect(ddbApi.getSize('FlightTime').catch((e) => {throw e;})).to.eventually.equal(2);
    });

    before(function(done) {
      ddbApi.createTableFlightTime()
        .then(function(data) {
          printInfo('FlightTime table created');
        })
        .then(function() {
          let flightDayTimeEntries = [{
            dep: 'IAS',
            arr: 'LCA',
            flightDay: '2017-10-16T00:00:00',
            flightDayTime: ['2017-10-16T06:05:00', '2017-10-16T13:30:00']
          },
          {
            dep: 'IAS',
            arr: 'LCA',
            flightDay: '2017-10-17T00:00:00',
            flightDayTime: ['2017-10-17T06:05:00', '2017-10-17T13:30:00']
          }];

          return ddbApi.insertFlightTimeBatch(flightDayTimeEntries);
        })
        .then((data) => {
          printInfo('FlightTime table populated');
          done();
        })
        .catch(function(err) {
          printInfo('Error creating or populating FlightTime');
          throw(err);
          done();
        });
    });

    after(function(done) {
      ddbApi.deleteAllTables(done);
    });
  });

  describe('FlightPrices ', function() {
    it('size: ', function() {
      return expect(ddbApi.getSize('FlightPrices').catch((e) => {throw e;})).to.eventually.equal(3);
    });

    before(function(done) {
      ddbApi.createTableFlightPrices()
      .then(function(data) {
        printInfo('FlightPrices table created');
      })
      .then(function() {
        let flightPriceEntries = [
          {
            dep: 'IAS',
            arr: 'LCA',
            flightTime: '2017-10-15T06:05:00',
            parseTimestamp: (new Date()).getTime(),
            price: 142
          },
          {
            dep: 'IAS',
            arr: 'LCA',
            flightTime: '2017-10-16T07:50:00',
            parseTimestamp: (new Date()).getTime(),
            price: 152
          },
          {
            dep: 'IAS',
            arr: 'LCA',
            flightTime: '2017-10-16T13:20:00',
            parseTimestamp: (new Date()).getTime(),
            price: 182
          }
        ];

        return ddbApi.insertFlightPriceBatch(flightPriceEntries);
      })
      .then((data) => {
        printInfo('FlightPrices table populated');
        done();
      })
      .catch(function(err) {
        printInfo('Error creating or populating FlightPrices');
        throw(err);
        done();
      });
    });

    after(function(done) {
      ddbApi.deleteAllTables(done);
    });
  });
});

function printInfo(msg) {
  console.log('\x1b[36m%s\x1b[0m', '      ' + msg); 
}