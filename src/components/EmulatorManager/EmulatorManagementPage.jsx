// EmulatorManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { useNavigate } from 'react-router-dom';

function EmulatorManagementPage() {
  const navigate = useNavigate();
  const [emulators, setEmulators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadEmulators();
  }, []);

  const loadEmulators = async () => {
    try {
      const emuList = await invoke('load_emulators_cache');
      setEmulators(emuList);
      console.log(`Loaded ${emuList.length} emulators from cache`);
    } catch (error) {
      console.error('Failed to load emulators:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanDirectory = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        directory: true,
        title: 'Select folder containing emulators'
      });

      if (selectedPath) {
        setScanning(true);
        const foundEmulators = await invoke('scan_directory_for_emulators', {
          directoryPath: selectedPath
        });

        if (foundEmulators.length > 0) {
          alert(`Found ${foundEmulators.length} emulator(s)!`);
          await loadEmulators();
        } else {
          alert('No emulators found in this directory');
        }
      }
    } catch (error) {
      console.error('Failed to scan directory:', error);
      alert('Error scanning directory: ' + error);
    } finally {
      setScanning(false);
    }
  };

  const addEmulatorManually = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        title: 'Select emulator executable',
        filters: [{
          name: 'Executable',
          extensions: ['exe', 'app', 'sh']
        }]
      });

      if (selectedPath) {
        const name = prompt('Enter emulator name (e.g., VisualBoyAdvance):');
        if (!name) return;

        const extensions = prompt('Enter supported file extensions (comma-separated, e.g., gba,gb,gbc):');
        if (!extensions) return;

        const extensionList = extensions.split(',').map(ext => ext.trim().toLowerCase());

        //This dosent exist yet
        await invoke('add_emulator_manually', {
          emulatorPath: selectedPath,
          emulatorName: name,
          supportedExtensions: extensionList
        });

        alert('Emulator added successfully!');
        await loadEmulators();
      }
    } catch (error) {
      console.error('Failed to add emulator:', error);
      alert('Error adding emulator: ' + error);
    }
  };

  const removeEmulator = async (emulatorPath) => {
    if (!confirm('Are you sure you want to remove this emulator?')) {
      return;
    }

    try {
      //This dosent exist yet
      await invoke('remove_emulator', {
        emulatorPath: emulatorPath
      });
      alert('Emulator removed successfully!');
      await loadEmulators();
    } catch (error) {
      console.error('Failed to remove emulator:', error);
      alert('Error removing emulator: ' + error);
    }
  };

  const updateFileTypes = async (emulatorPath, currentTypes) => {
    const newTypes = prompt(
      'Enter supported file extensions (comma-separated):',
      currentTypes.join(',')
    );

    if (newTypes === null) return;

    const typeList = newTypes.split(',').map(ext => ext.trim().toLowerCase());

    try {
      await invoke('update_emulator_file_types', {
        emulatorPath: emulatorPath,
        newFileTypes: typeList
      });
      alert('File types updated!');
      await loadEmulators();
    } catch (error) {
      console.error('Failed to update file types:', error);
      alert('Error updating file types: ' + error);
    }
  };

  if (loading) {
    return <div className="page"><p>Loading emulators...</p></div>;
  }

  return (
    <div className="page">
      <h2>Emulator Management</h2>

      <div className="emulatorActions">
        <button onClick={scanDirectory} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Scan Folder for Emulators'}
        </button>
        <button onClick={addEmulatorManually}>
          Add Emulator Manually
        </button>
      </div>

      {emulators.length === 0 ? (
        <div className="emptyState">
          <p>No emulators configured yet.</p>
          <p>Scan a folder or add an emulator manually to get started.</p>
        </div>
      ) : (
        <div className="emulatorList">
          <h3>Configured Emulators ({emulators.length})</h3>
          {emulators.map((emu, index) => (
            <div key={index} className="emulatorItem">
              <div className="emulatorInfo">
                <h4>{emu.emulator_name}</h4>
                <p className="emulatorPath">Path: {emu.emulator_path}</p>
                <p className="supportedTypes">
                  Supports: {emu.filetype_support.map(ext => `.${ext}`).join(', ')}
                </p>
              </div>
              <div className="emulatorItemActions">
                <button 
                  onClick={() => updateFileTypes(emu.emulator_path, emu.filetype_support)}
                  className="editButton"
                >
                  Edit Types
                </button>
                <button 
                  onClick={() => removeEmulator(emu.emulator_path)}
                  className="dangerButton"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="backButton" onClick={() => navigate('/settings')}>
        Back to Settings
      </button>
    </div>
  );
}

export default EmulatorManagementPage;