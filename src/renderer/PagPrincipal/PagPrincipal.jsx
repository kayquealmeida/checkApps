import { useState } from "react";
const ipcRenderer = window.require('electron').ipcRenderer;

export default function PagPrincipal() {

  const getApps = async () => {

    let apps = await ipcRenderer.invoke('getInstalledApplications');
    console.log(apps)
  }

  getApps()

  return <h2>PagPrincipal</h2>;
}
