const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Constants = require('../src/Constants');
const GlobalStorage = require('../src/GlobalStorage');
const MainEventManager = require('../src/MainEventManager');
const Config = require('../src/Config');
const DeviceComm = require('../src/DeviceComm');

var mainEventManager;
var globalStorage;
var deviceComm;
var mainWindow;

init();
loadConfig();
saveConfig();

function createWindow() {
    mainWindow = new BrowserWindow(
      {
        width: 900,
        height: 700,
        webPreferences: {
        //  preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true
        }
      }
    );

    mainWindow.loadURL(isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, "../build/index.html")}`
    );
    mainWindow.on('closed', () => (mainWindow = null));

    mainEventManager.publish('app-load');
    mainEventManager.subscribe('device-data-ready', onDeviceDataReady);

    ipc.on('log', onLog);
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    mainEventManager.publish('app-close');
    if ( process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if ( mainWindow === null ) {
        createWindow();
    }
});


function init() {
    mainEventManager = MainEventManager.getInstance();
    globalStorage = GlobalStorage.getInstance();
    globalStorage.homeDir = path.join(process.env.APPDATA,
                                      Constants.appName);
    globalStorage.configDir = globalStorage.homeDir;
    globalStorage.configFilePath = path.join(globalStorage.configDir,
                                             Constants.configFileName);

    deviceComm = DeviceComm.getInstance();
    console.log('CONNECTED=' + deviceComm.isConnected())
}


function loadConfig() {
    let cfg = new Config();
    cfg.load(globalStorage.configFilePath);
    for (let key of Constants.configVars) {
        globalStorage.config[key] = cfg.get(key)||'';
    }
    globalStorage.config.devicePort = '502';
    globalStorage.config.deviceIp = '10.8.10.101';

}


function saveConfig() {
    if ( !fs.existsSync(globalStorage.configDir) )  {
        fs.mkdirSync(globalStorage.configDir, {recursive: true});
    }

    let cfg = new Config();
    for (let key of Constants.configVars) {
        cfg.set(key, globalStorage.config[key]);
    }
    cfg.save(globalStorage.configFilePath);
}


function onDeviceDataReady() {
    mainWindow.send('device-data-ready', globalStorage.deviceData);
}


function onLog(event, arg) {
    console.log(arg);
    event.returnValue = null;
}
