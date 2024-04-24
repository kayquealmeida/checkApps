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
      contextIsolation: false,
      nodeIntegration: true,
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

const softwareList = [
  {
    "software_name": "7-Zip 23.01 (x64 edition)",
    "version": "23.01.00.0",
    "approved": false,
    "restrictedTo": null
  },
  {
    "software_name": "AcroReaderDC x86",
    "version": "22.003.20314",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Citrix Workspace x86",
    "version": "22.3.2000.2105",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Nexus PersonalDesktopClient x64",
    "version": "5.8.12",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Mozilla FirefoxESR x86",
    "version": "115.9.0",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Oracle Java8Update381 x64",
    "version": "8.0.3810.31",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Oracle Java8Update381 x86",
    "version": "8.0.3810.31",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "SAP SAPGUI x64",
    "version": "7700.1.12.1161",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "FireEye EndpointAgentHXVWdB x86",
    "version": "35.31.25",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Tenable NessusAgentANCVWDB x64",
    "version": "10.4.2.20158",
    "approved": true,
    "restrictedTo": "Anchieta"
  },
  {
    "software_name": "Tenable NessusAgentCURVWDB x64",
    "version": "10.4.2.20158",
    "approved": true,
    "restrictedTo": "Curitiba"
  },
  {
    "software_name": "Tenable NessusAgentTBTVWDB x64",
    "version": "10.4.2.20158",
    "approved": true,
    "restrictedTo": "Taubaté"
  },
  {
    "software_name": "Cisco Anyconnect x86",
    "version": "4.10.07062",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "Barco ClickShareExtensionPack x64",
    "version": "1.2.0.6",
    "approved": false,
    "restrictedTo": "Laptop"
  },
  {
    "software_name": "Flexera FlexNetInventoryAgentVWdoBrasil x86",
    "version": "17.01.11",
    "approved": true,
    "restrictedTo": "Vw"
  },
  {
    "software_name": "Flexera FlexNetInventoryAgentVWCO x86",
    "version": "17.01.11",
    "approved": true,
    "restrictedTo": "Vwco"
  },
  {
    "software_name": "ZSCALER ClientConnectorVWDB x64",
    "version": "3.7.1.53",
    "approved": false,
    "restrictedTo": null
  },
  {
    "software_name": "CheckPoint MobileClientE8620VWAG x86",
    "version": "98.61.3717",
    "approved": true,
    "restrictedTo": null
  },
  {
    "software_name": "FlexNetInventoryAgentAUDIBRx86",
    "version": "19.00.1046",
    "approved": true,
    "restrictedTo": "Audi"
  }
]

function getInstalledApplications(restrictions) {
  return new Promise((resolve, reject) => {
    console.log('Entrou na promise do getInstalledApplications')
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
          installed: packages.some(pkge => pkge.name === application.software_name && pkge.version === application.version)
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
ipcMain.handle('getInstalledApplications', async (event, restrictions) => {
  console.log('Restriction: ', restrictions)
  return getInstalledApplications(restrictions)
    .then(applications => {
      console.log('Aplications: ', applications)
      return applications;
    })
    .catch(error => {
      return { error: error.message };
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
