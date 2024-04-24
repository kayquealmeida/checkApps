/* eslint-disable no-unused-vars */
const { contextBridge, ipcRenderer, remote } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the IPC renderer
// to the main window. They'll be accessible at "window.ipcRenderer".
process.once("loaded", () => {
  contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
  contextBridge.exposeInMainWorld("remote",remote);
  console.log('load completed')
});
