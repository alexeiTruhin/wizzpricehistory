'use strict';
let request = require('request');

class WizzApi {
  constructor() {
    this.apiUrl = null;
    this.apicall = 0;
    this.updateApiVersionUrl();
    // this.apiUrl = 'https://be.wizzair.com/6.0.0/Api';
  }

  getApiVersionUrl(cache = true, url = 'https://wizzair.com/static/metadata.json') {
    if (this.apiUrl && cache) return Promise.resolve(this.apiUrl);
    return new Promise(function(resolve, reject) {
      request(url, function(error, response, body) {
        if (error) {
          reject(Error('Request error: ' + error));
        } else if (response.statusCode !== 200) {
          reject(Error('Bad statusCode error: ' + response.statusCode));
        } else {
          let resBody;
          try {
            resBody = JSON.parse(body);
          } catch (error) {
            reject(Error('Could not parse body. ' + error));
          }

          try {
            resolve(resBody.apiUrl);
          } catch(error) {
            reject(Error('apiUrl field not found!' + error));
          }
        }
      });
    }); 
  }

  updateApiVersionUrl() {
    let that = this;
    this.apiUrl = null;
    return this.getApiVersionUrl(false).then((r) => {that.apiUrl = r})
  }

  getMap() {
    // [ 
    //   {
    //     'iata': 'OTP',
    //     'currencyCode': 'RON',
    //     'shortName': 'Bucharest',
    //     'countryName': 'Romania',
    //     'countryCode': 'RO',
    //     'connections': [
    //       {
    //         'iata':'CIA',
    //         'isDomestic':'false'
    //       }
    //     ]
    //   }
    // ]
    let that = this;
    return new Promise(function(resolve, reject) {
      return that.getApiVersionUrl()
        .then(function(apiUrl) {
          let url = apiUrl + '/asset/map?languageCode=en-gb&forceJavascriptOutput=true&package=Wizzair';
          return request(url, function(error, response, body) {
            if (error) {
              reject(Error('Request error: ' + error));
            } else if (response.statusCode !== 200) {
              reject(Error('Bad statusCode error: ' + response.statusCode));
            } else {
              try {
                let countriesJSON = body.substr(body.indexOf('[')).replace(';', '');
                resolve(JSON.parse(countriesJSON));
              } catch (error) {
                reject(Error('Could not parse body. ' + error));
              }
            }
          });
        });
    });
  }

  getPricesDay(departure, arrival, depDate) {
    let that = this;
    return new Promise(function(resolve, reject) {
      return that.getApiVersionUrl()
        .then(function(apiUrl) {
          let payload = {
            'flightList':[
              {
                'departureStation': departure,
                'arrivalStation': arrival,
                'departureDate': depDate
              }
            ],
            'adultCount': 1,
            'childCount': 0,
            'infantCount': 0,
            'wdc': true
          },
          url = apiUrl + '/search/search',
          options = {
            url: url,
            body: JSON.stringify(payload),
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'cookie':'ASP.NET_SessionId=oyoy1pnr4qji2mpaguh1013d; _ga=GA1.2.411552624.1457814052; _gid=GA1.2.1119932722.1495348053; _gat=1',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
            } 
          };
          return request.post(options, function(error, response, body) {
            if (error) {
              reject(Error('Request error: ' + error));
              
            } else if (response.statusCode !== 200 && response.statusCode !== 400) {
              reject(Error('Bad statusCode error: ' + response.statusCode));
            } else if (response.statusCode === 400) {
              resolve(new Map());
            } else {
              try {
                let flights = JSON.parse(body).outboundFlights,
                    datePriceMap = new Map();

                flights.forEach(function(fly, i) {
                  if (!fly.fares.length) return;

                  let date = fly.departureDateTime.toString(),
                      price = -1;

                  if (fly.priceType !== 'soldOut') {
                    if (fly.fares.length > 3) {
                      price = fly.fares[3].basePrice.amount;
                    } else {
                      price = fly.fares[0].basePrice.amount;
                    }  
                  }

                  if (date && price) {
                    datePriceMap.set(date, price);
                  } else {
                    return
                  }
                });
                resolve(datePriceMap);
              } catch (error) {
                reject(Error('Could not parse body. ' + error));
              }
            }
          });
        });
    });
  }

  getPricesPeriod(departure, arrival, depDateFrom, depDateTo) {
    // Map {
    //   '2017-10-27T00:00:00' => Map { '2017-10-27T19:40:00' => 539 },
    //   '2017-10-28T00:00:00' => Map { '2017-10-28T06:05:00' => 359 },
    //   '2017-10-29T00:00:00' => Map { '2017-10-29T06:00:00' => 319, '2017-10-29T20:15:00' => 319 } }
    let that = this;
    return new Promise(function(resolve, reject) {
      return that.getApiVersionUrl()
        .then(function(apiUrl) {
          let payload = {
            'flightList':[
              {
                'departureStation': departure,
                'arrivalStation': arrival,
                'from': depDateFrom,
                'to': depDateTo
              }
            ],
            'priceType': 'regular'
          },
          url = apiUrl + '/search/timetable',
          options = {
            url: url,
            body: JSON.stringify(payload),
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'cookie':'ASP.NET_SessionId=oyoy1pnr4qji2mpaguh1013d; _ga=GA1.2.411552624.1457814052; _gid=GA1.2.1119932722.1495348053; _gat=1',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
            } 
          };

          return request.post(options, function(error, response, body) {
            if (error) {
              reject(Error('Request error: ' + error));
            } else if (response.statusCode !== 200) {
              reject(Error('Bad statusCode error: ' + response.statusCode));
            } else {
              try {
                // outboundFlights: {
                //   departureDate: '2017-10-01T00:00:00',
                //   departureDates: ['2017-10-01T06:05:00', '2017-10-01T19:40:00'],
                //   price: {amount: 500}
                // }
                let flights = JSON.parse(body).outboundFlights,
                    periodPriceMap = new Map();

                flights.forEach(function(fly, i) {
                  let date = fly.departureDate.toString(),
                      dateTimeArray = fly.departureDates,
                      dateTimeMap = new Map(),
                      price = -1;

                      if (fly.priceType !== 'soldOut') {
                        price = fly.price.amount;
                      }

                      // Implement when:
                      // price: null
                      // priceType: "soldOut"

                    dateTimeArray.forEach(function(dateTime, i) {
                      dateTimeMap.set(dateTime, price)
                    });

                  if (date && price) {
                    dateTimeMap
                    periodPriceMap.set(date, dateTimeMap);
                  } else {
                    return
                  }
                });

                resolve(periodPriceMap);
              } catch (error) {
                reject(Error('Could not parse body. ' + error));
              }
            }
          });
        });
    });
  }

  async getAndPopulatePricesPeriod(departure, arrival,  dateFrom, dateTo) {
    let pricesPeriodMap = await this.getPricesPeriod(departure, arrival,  dateFrom, dateTo);
    let that = this;
    let pricesDayPromiseArray = [];
    let pricesDayKeysArray = [];

    pricesPeriodMap.forEach((pricesPeriodMapValue, pricesPeriodMapKey) => {
      let dayPricesMap = pricesPeriodMapValue;
      if (dayPricesMap.size >= 2) {
        pricesDayKeysArray.push(pricesPeriodMapKey);
        pricesDayPromiseArray.push(that.getPricesDay(departure, arrival, new Date(pricesPeriodMapKey + 'Z')));
      }
    });

    let pricesDayArray = await Promise.all(pricesDayPromiseArray);

    pricesDayArray.forEach((v, i) => {
      let key = pricesDayKeysArray[i];
      pricesPeriodMap.set(key, v);
    });

    return pricesPeriodMap;
  }

  toString() {
    return 'Wizz API url: ' + this.apiUrl;
  }
}

module.exports = WizzApi;