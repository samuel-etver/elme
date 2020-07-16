const sqlite3 = require('sqlite3');
const Constants = require('../common/Constants');
const GlobalStorage = require('../common/GlobalStorage');
const MainEventManager = require('../common/MainEventManager')
const EventManager = require('../common/EventManager');
const path = require('path');

let globalStorage = GlobalStorage.getInstance();
let mainEventManager = MainEventManager.getInstance();
const dbName = Constants.appName + '.db';
const dbVersion = '1.0';
const propertiesTableName = 'Properties';
const measuresTableName = 'Measures';
const pipesTableName = 'Pipes';
const availableDatesTableName = 'AvailableDates';

class LocalArchive {
    constructor() {
        this.eventManager = new EventManager();
        this.opened = false;
        this.dbPath = undefined;
        this.db = undefined;
    }


    open(callback) {
        if ( this.opening ) {
            return;
        }

        this.opening = true;

        let goNext = function(command, ...restArgs) {
            new Promise(() => {
                this.eventManager.publish('open', command, ...restArgs)
            });
        }.bind(this);

        let goError = function(...restArgs) {
            goNext('error', ...restArgs);
        }.bind(this);

        let onOpen = function(event, command, ...restArgs) {
            mainEventManager.publish('log', command);

            switch(command) {
                case 'start':
                    goNext('close-old');
                    break;

                case 'close-old':
                    this.close();
                    goNext('open-or-create');
                    break;

                case 'open-or-create':
                    if ( !this.dbPath ) {
                        this.dbPath = path.join(globalStorage.homeDir, dbName);
                    }
                    this.db = new sqlite3.Database(this.dbPath, err => {
                        err ? goError(err) : goNext('properties-table-begin')
                    });
                    break;

                case 'properties-table-begin':
                    this.db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                      [propertiesTableName], (err, rows) => {
                          err ? goError(err)
                              : goNext( rows.length
                                          ? 'properties-table-check'
                                          : 'properties-table-create');
                    });
                    break;

                case 'properties-table-create':
                    this.db.run('CREATE TABLE ' + propertiesTableName + ' (Key TEXT, Value TEXT)',
                      [], (err) => {
                          err ? goError(err) : goNext('properties-table-fill');
                    });
                    break;

                case 'properties-table-fill': {
                    let data = [
                        ['AppId', Constants.appId],
                        ['DbVersion', dbVersion]
                    ];
                    let placeholders = data.map(() => '(?,?)').join(',');
                    this.db.run('INSERT INTO ' + propertiesTableName + '(Key,Value) VALUES ' + placeholders,
                      data.flat(), (err) => {
                          err ? goError(err) : goNext('properties-table-end');
                    });
                    break;
                }

                case 'properties-table-check':
                    this.db.all('SELECT Key, Value FROM ' + propertiesTableName,
                      [], (err, rows) => {
                          if ( err ) {
                              goError(err);
                          } else {
                              let properties = {};
                              rows.forEach(item => {
                                  properties[item.Key] = item.Value;
                              });

                              if ( properties['AppId'] !== Constants.appId ) {
                                  goError('Wrong Application Id');
                              } else if ( properties['DbVersion'] !== dbVersion ) {
                                  goError('Wrong DB Version');
                              } else {
                                  goNext('properties-table-end');
                              }
                          }
                    });
                    break;

                case 'properties-table-end':
                    goNext('measures-table-begin');
                    break;

                case 'measures-table-begin':
                    this.db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                      [measuresTableName], (err, rows) => {
                          err ? goError(err)
                              : goNext( rows.length
                                          ? 'measures-table-end'
                                          : 'measures-table-create');
                    });
                    break;

                case 'measures-table-create':
                    this.db.run('CREATE TABLE ' + measuresTableName
                      + ' (Dt INTEGER PRIMARY KEY'
                      + ',InductorTemperature1 REAL'
                      + ',InductorTemperature2 REAL'
                      + ',ThermostatTemperature1 REAL'
                      + ',ThermostatTemperature2 REAL'
                      + ',SprayerTemperature REAL'
                      + ',HeatingTemperature REAL'
                      + ',WaterFlow REAL'
                      + ')',
                      [], (err) => {
                          err ? goError(err) : goNext('measures-table-end');
                    });
                    break;

                case 'measures-table-end':
                    goNext('pipes-table-begin');
                    break;

                case 'pipes-table-begin':
                    this.db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                      [pipesTableName], (err, rows) => {
                          err ? goError(err)
                              : goNext( rows.length
                                          ? 'pipes-table-end'
                                          : 'pipes-table-create');
                    });
                    break;

                case 'pipes-table-create':
                    this.db.run('CREATE TABLE ' + pipesTableName
                      + ' (DtStart INTEGER'
                      + ',DtStop  INTEGER'
                      + ')',
                      [], (err) => {
                          err ? goError(err) : goNext('pipes-table-end');
                    });
                    break;

                case 'pipes-table-end':
                    goNext('available-dates-table-begin');
                    break;

                case 'available-dates-table-begin':
                    this.db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                      [availableDatesTableName], (err, rows) => {
                          err ? goError(err)
                              : goNext( rows.length
                                          ? 'available-dates-table-end'
                                          : 'available-dates-table-create');
                    });
                    break;

                case 'available-dates-table-create':
                    this.db.run('CREATE TABLE ' + availableDatesTableName
                      + ' (Dt INTEGER NOT NULL PRIMARY KEY'
                      + ',Hours INTEGER'
                      + ')',
                      [], (err) => {
                          err ? goError(err) : goNext('available-dates-table-end');
                    });
                    break;

                case 'available-dates-table-end':
                    goNext('success');
                    break;

                case 'success':
                    this.opened = true;
                    this.openening = false;
                    if ( callback ) {
                        callback('success');
                    }
                    //this.write([{}, {}]);
                    break;

                default:
                    this.opening = false;
                    this.close();
                    if ( callback ) {
                        callback('failure', ...restArgs);
                    }
            }
        }.bind(this);

        this.eventManager.subscribe('open', onOpen);
        goNext('start');
    }


    close() {
        this.opened = false;
        if ( this.db ) {
            let db = this.db;
            this.db = undefined;
            db.close();
        }
    }


    isOpened() {
        return this.opened;
    }


    read(fromDate, toDate, callback) {
        if ( !this.isOpened() ) {
            callback('failure', 'not opened');
            return;
        }

        if ( !this.measuresTableSelectPattern ) {
            this.measuresTableSelectPattern = 'SELECT * FROM '
              + measuresTableName
              + ' WHERE ';
        }
    }


    write(data, callback) {
        if ( !this.isOpened() ) {
            callback('failure', 'not opened');
            return;
        }

        if ( !data || !data.length ) {
            callback('success');
            return;
        }

        if ( !this.measuresTableInsertPattern ) {
            let fields = [
                'Dt',
                'InductorTemperature1',
                'InductorTemperature2',
                'ThermostatTemperature1',
                'ThermostatTemperature2',
                'SprayerTemperature',
                'HeatingTemperature',
                'WaterFlow'
            ];
            this.measureTableInsertPattern = 'INSERT OR REPLACE INTO '
              + measuresTableName
              + ' (' + fields.join(',') + ') VALUES ';
            this.measureTableInsertRecordPlaceholders =
              '(' + fields.map(() => '?').join(',') + ')';
        }

        let query = this.measureTableInsertPattern +
          data.map(() => this.measureTableInsertRecordPlaceholders).join(',');
        let records = data.map(item =>
            [
                item.date,
                item.inductorTemperature1,
                item.inductorTemperature2,
                item.thermostatTemperature1,
                item.thermostatTemperature2,
                item.sprayerTemperature,
                item.heatingTemperature,
                item.waterFlow
            ]
        );

        this.db.run(query, records.flat(), (err) => {
            if ( callback ) {
                callback(err ? 'failure' : 'success', err);
            }
        });
    }


    delete(fromDate, toDate, callback) {
        if ( !this.isOpened() ) {
            callback('failure');
            return;
        }

        if ( this.measuresTableDeletePattern ) {
            this.measuresTableDeletePattern = 'DELETE FROM '
              + measuresTableName
              + ' WHERE ';
        }
    }
}

module.exports = LocalArchive;
