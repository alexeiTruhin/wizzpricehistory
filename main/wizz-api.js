'use strict';
let request = require('request');
let exec = require('child_process').exec;
// let tor = require('tor-request');
// tor.TorControlPort.password = 'giraffe';
// let request = tor.request;

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36';

class WizzApi {
  constructor() {
    this.apiUrl = null;
    this.apicall = 0;
    this.cookie = null;
    this.cookieStartedRequest = false;
    this.updateCookie();
    this.updateApiVersionUrl();
    // this.apiUrl = 'https://be.wizzair.com/6.0.0/Api';
  }

  getCookie(cache = true) {
    if (this.cookieStartedRequest) return this.cookieStartedRequest;
    if (this.cookie && cache) return Promise.resolve(this.cookie);
    
    this.cookieStartedRequest = new Promise((resolve, reject) => {
      return this.getApiVersionUrl()
        .then(function(apiUrl) {
          let
          //url = apiUrl + '/information/browserSupport',
          url = apiUrl + '/information/buildNumber',
          options = {
            url: url,
            headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9,ro;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
      'connection': 'open'
            } 
          };
	  console.log(options);
	  //Temporary
	  //resolve('ak_bmsc=D0856A430327C6B4DBDD15FF733410310210B5165B1D0000E8C50B5C4501732D~plhWH04eb5GTS17uiXAp9CtuI56o/fH9rWRUzEnZpJh7dfuP1rE41d9kzWkuYk4yVdeQbuURunGufbyD4B76huSkckPgFn2aneJc/zrh8xH/K+YnIwWk2YGfZU3r4EpBGwhSwRgyHj7plDpXAdrlwLocob1qdNt7qIlJ3iO7WHNITiBfi8+M1dsfnzsrzO/gjyvRP/VYIew/Ip89YhmQ5cm89UNgQFXmOYH8Iwt2OaZIM=;');
/*
	return request.get(options, function(error, response, body) {
            console.log(response.headers);
            this.cookieStartedRequest = false;
            if (error) {
              reject(Error('Request error: ' + error));
            } else if (response.statusCode !== 200 && response.statusCode !== 400) {
              reject(Error('Bad statusCode error: ' + response.statusCode));
            } else if (!response.headers['set-cookie'][0]){
              reject(Error('Response header doesn\'t contain set-cookie attribute: ' + error));
            } else {
              resolve(response.headers['set-cookie'][0].split(' ')[0]);
            }
          });
*/
          exec('sh getWizzCache.sh ' + apiUrl,
            (error, stdout, stderr) => {
              console.log(stdout);
              if (error !== null) {
	 	reject(Error('Failed \'sh getWizzCache.sh\' with error: ' + error));
              } else {
	    	resolve(stdout.slice(0, -1)); // remove last character, probably new line
     	      };
            }
          );
        
	})
      .catch((error) => {throw ('Failed to get cookie. ' + error);}); 
    })
    .catch((error) => {throw (error);}); 
    return this.cookieStartedRequest;
  }

  updateCookie() {
    this.cookie = null;
    this.cookieStartedRequest = false;
    return this.getCookie(false).then((r) => {this.cookie = r;}).catch((error) => {logger.error('Failed to get cookie. ' + error);});
  }

  getApiVersionUrl(cache = true, url = 'https://wizzair.com/static_fe/metadata.json') {
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
	    // TODO: validate body is a valid JSON
	    try {
              resBody = JSON.parse(body);
            } catch (error) {
              logger.error('Could not parse body. Trying fallback.');
              resBody = JSON.parse(body.substring(1, body.length));
	    }
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
    return this.getApiVersionUrl(false).then((r) => {that.apiUrl = r}).catch((e) => logger.error('Failed to update API version' + e));
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
          //let url = apiUrl + '/asset/map?languageCode=en-gb&forceJavascriptOutput=true&package=Wizzair';
          let url = apiUrl + '/asset/map?languageCode=en-gb&forceJavascriptOutput=true';
          console.log(url);
          let options = {
            url: url,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'user-agent': USER_AGENT
            } 
          };
          return request(options, function(error, response, body) {
            if (error) {
              reject(Error('Request error: ' + error));
            } else if (response.statusCode !== 200) {
              reject(Error('Bad statusCode error: ' + response.statusCode));
            } else {
              try {
                resolve(JSON.parse(body).cities);
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
          return that.getCookie()
            .then(function(cookie) {
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
                  'cookie': cookie,
                  'user-agent': USER_AGENT
		} 
              };
              return request.post(options, function(error, response, body) {
                if (error) {
                  reject(Error('Request error: ' + error));
                  
                } else if (response.statusCode !== 200 && response.statusCode !== 400) {
                  //that.updateCookie();
                  reject(Error('Bad statusCode error: ' + response.statusCode));
                } else if (response.statusCode === 400) {
                  //that.updateCookie();
                  resolve(new Map());
                } else {
                  try {
                    let flights = JSON.parse(body).outboundFlights,
                        datePriceMap = new Map();

                    flights.forEach(function(fly, i) {
                      //if (!fly.fares.length) return;

                      let date = fly.departureDateTime.toString(),
                          price = -1;

                      if (fly.priceType !== 'soldOut' && fly.fares.length) {
                        if (fly.fares.length > 3) {
                          price = fly.fares[3].discountedPrice ? fly.fares[3].discountedPrice.amount : fly.fares[3].basePrice.amount;
                        } else {
                          price = fly.fares[0].discountedPrice ? fly.fares[0].discountedPrice.amount : fly.fares[0].basePrice.amount;
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
            })
            .catch((error) => {throw ('Failed to get cookie. ' + error);});
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
          return that.getCookie()
            .then(function(cookie) {
              let payload = {
                'adultCount': 1,
                'childCount': 0,
                'infantCount': 0,
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
                  'cookie': cookie,
                  'user-agent': USER_AGENT
                }
              };

              return request.post(options, function(error, response, body) {
                //console.log('body', body);
                if (error) {
                  reject(Error('Request error: ' + error));
                } else if (response.statusCode !== 200) {
                  //that.updateCookie();
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

                    //console.log('periodMap', periodPriceMap);
                    resolve(periodPriceMap);
                  } catch (error) {
                    reject(Error('Could not parse body. ' + error));
                  }
                }
              });
            })
            .catch((error) => {throw ('Failed to get cookie. ' + error);});
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
