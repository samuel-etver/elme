const appName = 'elme';
const configFileName = appName + '.config';

let months = [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь'
];


months.capitalize = function(index) {
    let str = months[index];
    return str.charAt(0).toUpperCase() + str.slice(1);
}


months.find = function(str) {
    if ( !str ) {
        return -1;
    }

    str = str.toLowerCase();
    return months.findIndex(element => element === str);
}


months.has = function(str) {
    return months.find(str) >= 0;
}


months.findByPartialMatch = function(str) {
    if ( !str ) {
        return -1;
    }
    return -1;
}



module.exports = {
    debug: false,
    appName: appName,
    configFileName: configFileName,
    configVars: [
        'deviceIp',
        'devicePort',
    ],
    deviceReadInterval: 1000,
    deviceMock: true,
    rtChartPeriod: 30*60, // seconds
    rtChartRecordInterval: 30, // seconds
    months: months,
};
