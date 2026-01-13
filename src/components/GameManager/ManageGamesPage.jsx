// ManageGamesPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { open } from "@tauri-apps/api/dialog";
import { basename, resolveResource } from '@tauri-apps/api/path';
import { invoke } from "@tauri-apps/api/tauri";
import "./ManageGamesPage.css";

function ManageGamesPage({ handleAddEmulator }) {
  const navigate = useNavigate();
  const [scannedFiles, setScannedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'single'

  // Scan folder functionality
  const scanFolder = async () => {
    try {
      const selectedPath = await open({
        multiple: false, 
        directory: true,  
      });

      if(selectedPath){
        console.log(selectedPath, "is selected")
        const resourcePath = await resolveResource(selectedPath);
        console.log("Resource path: ", resourcePath)
        
        const files = await invoke("scan_for_games", {currentDir: String(selectedPath)});
        
        setScannedFiles(files);
        setSelectedFiles([]);
        console.log("Files found: ", files)
      }
    } catch (error) {
      console.log("Error scanning folder: ", error);
    }
  }

  const addSelectedFiles = () => {
    if (selectedFiles.length === 0) return;
    
    console.log("Adding games:", selectedFiles);
    
    const newEmulators = selectedFiles.map((file) => ({
      name: file.rom_name,
      path: file.rom_path,
      filename: file.rom_name,
      extension: file.rom_extension,
    }));
    
    handleAddEmulator(newEmulators);
    setSelectedFiles([]);
    setScannedFiles([]);
    navigate('/');
  }

  // Single file functionality
  const selectSingleFile = async () => {
    try {
      const selectedPath = await open({
        multiple: false, 
        title: "Open any file",  
        filters: [{
          name: 'Program',
          extensions: ['exe', 'NDS', 'ISO', 'GBA']
        }]
      });
    
      if(selectedPath){
        const resourcePath = await resolveResource(selectedPath);
        const base = await basename(resourcePath);
        var emulatorName = base.substring(0, base.lastIndexOf('.'));
        var extension = base.substring(base.lastIndexOf('.'), base.length).toLowerCase().replace('.','');

        handleAddEmulator([{
          name: emulatorName,
          path: String(selectedPath),
          filename: base,
          extension: extension
        }]);
        console.log ("Added single file:", selectedPath, extension);
        navigate('/');
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="page">
      <h2>Manage Games</h2>
      <div className="tabs">
        <button 
          className={activeTab === 'scan' ? 'active' : ''} 
          onClick={() => setActiveTab('scan')}
        >
          Scan Folder
        </button>
        <button 
          className={activeTab === 'single' ? 'active' : ''} 
          onClick={() => setActiveTab('single')}>
          Add Single File
        </button>
      </div>
      {activeTab === 'scan' && (
        <div className="tabContent">
          <h3>Scan Folder for Games</h3>
          <p>Select a folder to scan for game files</p>
          <button onClick={scanFolder}>Select Folder</button>

          {scannedFiles.length > 0 && (
            <div className="scannedFiles">
              <h4>Found {scannedFiles.length} game(s)</h4>
              <div className="fileList">
                {scannedFiles.map((file, index) => (
                  <label key={index} className="fileItem">
                    <input
                      type="checkbox"
                      checked={selectedFiles.some(f => f.rom_path === file.rom_path)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles([...selectedFiles, file]);
                        } else {
                          setSelectedFiles(selectedFiles.filter(f => f.rom_path !== file.rom_path));
                        }
                      }}
                    />
                    <span className="fileName">{file.rom_name}</span>
                    <span className="fileExt">{file.rom_extension}</span>
                  </label>
                ))}
              </div>
              <div className="actions">
                <button 
                  onClick={addSelectedFiles} 
                  disabled={selectedFiles.length === 0}
                  className="primary"
                >
                  Add {selectedFiles.length} Selected
                </button>
                <button onClick={() => {
                  setScannedFiles([]);
                  setSelectedFiles([]);
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single File Tab */}
      {activeTab === 'single' && (
        <div className="tabContent">
          <h3>Add Single Game File</h3>
          <p>Select an individual game file to add</p>
          <button onClick={selectSingleFile}>Browse Files</button>
        </div>
      )}

      <button className="backButton" onClick={() => navigate('/')}>Back to Library</button>
    </div>
  );
}

export default ManageGamesPage;