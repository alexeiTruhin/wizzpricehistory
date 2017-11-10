'use strict';
let AWS = require('aws-sdk'),
  dynamodb,
  docClient;

class DdbApi {
  constructor(endpoint = 'http://dynamodb.eu-west-1.amazonaws.com') {
    AWS.config.update({
      region: 'eu-west-1', // DUB
      endpoint: endpoint // http://localhost:8000
    });
    dynamodb = new AWS.DynamoDB(),
    docClient = new AWS.DynamoDB.DocumentClient();

    this.endpoint = endpoint
  }

  createTableFlightPrices() {
    // hashkey: 'IAS|LCA|2017-10-15T06:05:00'
    // sortkey: 1507962008734
    // price: 120
    const tableName = 'FlightPrices';
    const params = {
      TableName : tableName,
      KeySchema: [       
        { AttributeName: 'FlightIdentifier', KeyType: 'HASH'},  //Partition key
        { AttributeName: 'PriceScanTimestamp', KeyType: 'RANGE' }  //Sort key
      ],
      AttributeDefinitions: [       
        { AttributeName: 'FlightIdentifier', AttributeType: 'S' },
        { AttributeName: 'PriceScanTimestamp', AttributeType: 'N' }
        //{ AttributeName: 'Price', AttributeType: 'N' }
      ],
      ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
      }
    };

    return createTable(tableName, params);
  }

  insertFlightPrice(entry) {
    try {
      this.validateFlightPriceEntry(entry);
    } catch(err) {
      return Promise.reject(err);
    }

    let params = {
      TableName: 'FlightPrices',
      Item: {
        'FlightIdentifier': [entry.dep, entry.arr, entry.flightTime].join('|'),
        'PriceScanTimestamp': entry.parseTimestamp,
        'Price': entry.price
      }
    };

    return docClient.put(params).promise();
  }

  insertFlightPriceBatch(entries) {
    let that = this,
      validateErr;
    entries.forEach(function(entry, i, arr) {
      try {
        that.validateFlightPriceEntry(entry);
      } catch(err) {
        validateErr = err;
        return;
      }

      let newEntry = {
        PutRequest: {
          Item: {
            'FlightIdentifier': [entry.dep, entry.arr, entry.flightTime].join('|'),
            'PriceScanTimestamp': entry.parseTimestamp,
            'Price': entry.price
          }
        }
      };

      entries[i] = newEntry;
    });

    if (validateErr) {
      return Promise.reject(validateErr);
    }

    // let params = {
    //   RequestItems: {
    //     'FlightPrices': entries
    //   }
    // };

    return insertInChuncks('FlightPrices', entries, 5);
  }

  validateFlightPriceEntry(entry) {
    let MISMATCH = 'Type mismatch FlightPrice ';
    if (typeof entry.price !== 'number') {
      throw new Error(MISMATCH + 'price. Entry: ', entry);
    }
    if (typeof entry.dep !== 'string') {
      throw new Error(MISMATCH + 'dep. Entry: ', entry);
    }
    if (typeof entry.arr !== 'string') {
      throw new Error(MISMATCH + 'arr. Entry: ', entry);
    }
    if (typeof entry.parseTimestamp !== 'number' || isNaN(new Date(entry.parseTimestamp).getTime())) {
      throw new Error(MISMATCH + 'parseTimestamp. Entry: ', entry);
    }
    if (typeof entry.flightTime !== 'string' || isNaN(new Date(entry.flightTime).getTime())) {
      throw new Error(MISMATCH + 'flightTime. Entry: ', entry);
    }

  }

  createTableFlightPricesS() {
    // hashkey: 'IAS|LCA|2017-10-15T06:05:00'
    // sortkey: 1507962008734
    // price: 120

    let params = {
      TableName : 'FlightPrices',
      KeySchema: [       
        { AttributeName: 'FlightIdentifier', KeyType: 'HASH'},  //Partition key
        { AttributeName: 'PriceScanTimestamp', KeyType: 'RANGE' }  //Sort key
      ],
      AttributeDefinitions: [       
        { AttributeName: 'FlightIdentifier', AttributeType: 'S' },
        { AttributeName: 'PriceScanTimestamp', AttributeType: 'N' }
        //{ AttributeName: 'Price', AttributeType: 'N' }
      ],
      ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
      }
    };


    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
        }
    });
  }

  createTableFlightTime() {
    // hashkey: 'IAS|LCA|2017-10-15T00:00:00'
    // flightDayTime: ['2017-10-15T06:05:00', '2017-10-15T12:30:00']
    const tableName = 'FlightTime';
    const params = {
      TableName : tableName,
      KeySchema: [       
        { AttributeName: 'FlightDay', KeyType: 'HASH'}  //Partition key
      ],
      AttributeDefinitions: [       
        { AttributeName: 'FlightDay', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
      }
    };

    return createTable(tableName, params);
  }

  insertFlightTime(entry) {
    try {
      this.validateFlightTimeEntry(entry);
    } catch(err) {
      return Promise.reject(err);
    }

    let params = {
      TableName: 'FlightTime',
      Item: {
        'FlightDay': [entry.dep, entry.arr, entry.flightDay].join('|'),
        'FlightDayTime': entry.flightDayTime
      }
    };

    return docClient.put(params).promise();
  }

  insertFlightTimeBatch(entries) {
    let that = this,
      validateErr;
    entries.forEach(function(entry, i, arr) {
      try {
        that.validateFlightTimeEntry(entry);
      } catch(err) {
        validateErr = err;
        return;
      }

      let newEntry = {
        PutRequest: {
          Item: {
            'FlightDay': [entry.dep, entry.arr, entry.flightDay].join('|'),
            'FlightDayTime': entry.flightDayTime
          }
        }
      };

      entries[i] = newEntry;
    });

    if (validateErr) {
      return Promise.reject(validateErr);
    }

    // let params = {
    //   RequestItems: {
    //     'FlightTime': entries
    //   }
    // };

    return insertInChuncks('FlightTime', entries, 5);
  }

  validateFlightTimeEntry(entry) {
    let MISMATCH = 'Type mismatch FlightTime ';
    let entryJson = JSON.stringify(entry);
    if (typeof entry.dep !== 'string') {
      throw new Error(MISMATCH + 'dep. Entry: ' + entryJson);
    }
    if (typeof entry.arr !== 'string') {
      throw new Error(MISMATCH + 'arr. Entry: ' + entryJson);
    }
    if (typeof entry.flightDay !== 'string' || isNaN(new Date(entry.flightDay).getTime())) {
      throw new Error(MISMATCH + 'flightDay. Entry: ' + entryJson);
    }

    if (!Array.isArray(entry.flightDayTime) || !entry.flightDayTime.length) {
      throw new Error(MISMATCH + 'flightDayTime. Entry: ' + entryJson);
    }
    
    entry.flightDayTime.forEach(function(dayTime, i, arr) {
      if (typeof dayTime !== 'string' || isNaN(new Date(dayTime).getTime())) {
        throw new Error(MISMATCH + 'flightDayTime. Entry: ' + entryJson);
      }
    });

  }

  getSize(table) {
    return dynamodb.describeTable({TableName: table}).promise().then((data) => {
      return data.Table.ItemCount;
    });
  }

  deleteAllTables(done) {
    const env = process.env.NODE_ENV || 'development';
    if (this.endpoint !== 'http://localhost:8000' || env !== 'development') {
      console.error('The method "deleteAllTables" is prohibited in prod!'); 
      throw new Error('Method "deleteAllTables" was called in prod!');
      return;
    }

    dynamodb.listTables({Limit: 10}, function(err, data) {
      if (err) {
        console.log('Error', err.code);
      } else {
        // console.log('Tables to delete are ', data.TableNames);

        let tableNames = data.TableNames;
        if (!tableNames.length) done();

        tableNames.forEach(function(tableName, i) {
          dynamodb.deleteTable({TableName: tableName}, function(err, data) {
            if (err) {
              console.error('Unable to delete table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
              // console.log('Deleted table. Table: ', tableName);
            }

            if (i == tableNames.length - 1 || err) {
              done();
            }
          });

        });
      }
    });
  }
}

async function insertInChuncks(table, entries, chunckSize) {
  let entriesCopy = entries.slice(),
    result;

  while(entriesCopy.length) {
    let chunck = entriesCopy.splice(0, chunckSize);
    let params = {RequestItems: {}};
    params.RequestItems[table] = chunck;

    result = await docClient.batchWrite(params).promise();
  }      

  return result;
}

function createTable(tableName, params) {
  return dynamodb.listTables({}).promise()
    .then((data) => {
      const exists = data.TableNames
        .filter(name => {
          return name === tableName;
        })
        .length > 0;
      if (exists) {
        return Promise.resolve();
      }
      else {
        return dynamodb.createTable(params).promise();
      }
    });
}

module.exports = DdbApi;