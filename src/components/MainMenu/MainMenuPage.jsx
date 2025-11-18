// MainMenuPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function MainMenuPage({ emulators }) {
  const navigate = useNavigate();

  // Group games by console type based on extension
  const groupByConsole = () => {
    const groups = {};
    
    emulators.forEach(emu => {
      if (emu.default) return; // Skip the home item
      
      let console = 'Unknown';
      switch(emu.extension?.toLowerCase()) {
        case '.gba':
          console = 'Game Boy Advance';
          break;
        case '.nds':
          console = 'Nintendo DS';
          break;
        case '.iso':
          console = 'ISO Games';
          break;
        case '.exe':
          console = 'PC Games';
          break;
        default:
          console = 'Other';
      }
      
      if (!groups[console]) {
        groups[console] = [];
      }
      groups[console].push(emu);
    });
    
    return groups;
  };

  const consoleGroups = groupByConsole();
  const totalGames = emulators.filter(emu => !emu.default).length;

  return (
    <div className="page">
      <h1>Game Library</h1>
      <p>Total Games: {totalGames}</p>
      
      {totalGames === 0 ? (
        <div className="emptyState">
          <p>No games in your library yet.</p>
          <button onClick={() => navigate('/manage-games')}>Add Games</button>
        </div>
      ) : (
        <div className="consoleList">
          {Object.entries(consoleGroups).map(([console, games]) => (
            <div key={console} className="consoleSection">
              <h2>{console}</h2>
              <p>{games.length} game(s)</p>
              <div className="gameGrid">
                {games.map((game) => (
                  <div key={game.id} className="gameCard" onClick={() => navigate(`/${game.subpath}`)}>
                    <h3>{game.name}</h3>
                    <p className="gamePath">{game.filename}</p>
                    <button onClick={(e) => { e.stopPropagation();navigate(`/${game.subpath}`);}}>
                      Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
         <button onClick={() => navigate('/manage-games')}>Add Games</button>
        </div>
      )}
      
    </div>
  );
}

export default MainMenuPage;