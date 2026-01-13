// SettingsPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage({ emulators, setEmulators, setId }) {
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllGames = () => {
    // Keep only the default "Home" item
    setEmulators(emulators.filter(emu => emu.default));
    setShowClearConfirm(false);
    setId(1); // Reset ID counter
  };

  const totalGames = emulators.filter(emu => !emu.default).length;

  return (
    <div className="page">
      <h2>Settings</h2>
      
      <div className="settingsSection">
        <h3>Library</h3>
        <p>Total games: {totalGames}</p>
        <button 
          onClick={() => setShowClearConfirm(true)}
          disabled={totalGames === 0}
          className="dangerButton"
        >
          Clear All Games
        </button>
      </div>

      <div className="settingsSection">
        <h3>About</h3>
        <p>Emulator Manager v1.0</p>
      </div>

      {showClearConfirm && (
        <div className="modal">
          <div className="modalContent">
            <h3>Clear All Games?</h3>
            <p>This will remove all {totalGames} games from your library. This action cannot be undone.</p>
            <div className="modalActions">
              <button onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button onClick={clearAllGames} className="dangerButton">Clear All</button>
            </div>
          </div>
        </div>
      )}

      <button className="backButton" onClick={() => navigate('/')}>Back</button>
    </div>
  );
}

export default SettingsPage;