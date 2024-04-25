import { useState, useRef } from "react";
const ipcRenderer = window.require('electron').ipcRenderer;
import './PagPrincipal.css';
import reload from '../../../assets/icons/reload.png';
export default function PagPrincipal() {

  const [testedApps, setTestedApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const hiddenFileInput = useRef(null);

  const handleTestSoftwares = async () => {
    setLoadingStatus('Verificando...');
    let apps = await ipcRenderer.invoke('getInstalledApplications');
    setTestedApps(apps);
  }

  const handleReloadClick = () => {
    // Envia uma mensagem IPC para solicitar a recarga
    ipcRenderer.send('reload-app');
  };

  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };

  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    ipcRenderer.invoke('getAppList', fileUploaded.path);
    setLoading(true)
    setLoadingStatus('Lista carregada, por favor clique em verificar...');
    console.log('File Uploaded', fileUploaded.path);
  };


return (
    <div className="container">
        <div className="title">
          <h1>Check Installed Applications</h1>
          <a className="realoadButton" onClick={handleReloadClick}>Reload <img src={reload} alt="Reload Image" /></a>
        </div>
        <div className="tableContent">
          {testedApps.length > 0 ? <div>
          <table>
            <thead>
              <tr>
                <th>Nome da aplicação</th>
                <th>Versão</th>
                <th>Status</th>
              </tr>
            </thead>
            {testedApps.map((app) => (
              <tbody>
                <tr key={app.software_name}>
                  <td>{app.software_name}</td>
                  <td>{app.version}</td>
                  <td>{app.installed ? 'Instalado' : 'Não instalado'}</td>
                </tr>
              </tbody>
            ))}
          </table>
        </div> : <p>{loading ? loadingStatus : 'Nenhuma lista anexada'}</p>}
      </div>
        <div className="btnSection">
          <button className="button-upload" onClick={handleClick}>
            Upload a file
          </button>
          <input
            type="file"
            onChange={handleChange}
            ref={hiddenFileInput}
            style={{ display: "none" }}
          />
          <button className="verifyButton" onClick={handleTestSoftwares}>
            Verificar
          </button>
        </div>

    </div>
  )
}
