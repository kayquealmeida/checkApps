/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
const { exec } = require('child_process');
import { resolveHtmlPath } from './util';
const csvFilePath = 'c:/checkapps/apps.csv'; // Path to your CSV file
const csv = require('csvtojson');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });


};

let softwareList; // Define a variable to hold JSON data

csv()
    .fromFile(csvFilePath)
    .then((jsonObj) => {
        softwareList = jsonObj;
    })
    .catch((err) => {
        console.error('Error:', err);
    });

function getInstalledApplications(restrictions) {
  return new Promise((resolve, reject) => {
    exec('winget list', (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing command: ${error}`);
        return;
      }

      if (stderr) {
        reject(`Command stderr: ${stderr}`);
        return;
      }

      const lines = stdout.trim().split('\n');
      lines.splice(0, 5);

      const packages = lines.map(line => {
        const columns = line.trim().split(/\s{2,}/); // Split by multiple spaces
        const name = columns[0];
        const id = columns[1];
        const version = columns[2];
        const available = columns[3];
        const origin = columns[4];
        return { name, id, version, available, origin };
      });

      const providedApplications = softwareList.map(application => {
        return {
          ...application,
          installed: packages.some(package => package.name === application.software_name && package.version === application.version)
        };
      });

      if (restrictions && restrictions.length > 0) {
        providedApplications = providedApplications.filter(application => restrictions.includes(application.restrictedTo));
      }

      resolve(providedApplications);
    });
  });
}


// restrictions: Array<restrictedTo>
ipcMain.on('getInstalledApplications', (event, restrictions) => {
  getInstalledApplications(restrictions)
    .then(applications => {
      event.reply('getInstalledApplicationsResponse', { applications });
    })
    .catch(error => {
      event.reply('getInstalledApplicationsResponse', { error: error.message });
    });
});



app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
