import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./MainMenuPage.css";

function MainMenuPage({ emulators }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Group games by console type based on extension
  const groupByConsole = () => {
    const groups = {};
    
    emulators.forEach(emu => {
      if (emu.default) return;
      
      // Filter by search query
      if (searchQuery && !emu.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return; // Skip games that don't match search
      }
      
      // Normalize extension
      const ext = emu.extension?.toLowerCase().replace('.', '');
      
      let gameconsole = 'Unknown';
      switch(ext) {
        case 'gba':
          gameconsole = 'Game Boy Advance';
          break;
        case 'nds':
          gameconsole = 'Nintendo DS';
          break;
        case 'iso':
          gameconsole = 'ISO Games';
          break;
        case 'exe':
          gameconsole = 'PC Games';
          break;
        default:
          gameconsole = 'Other';
      }
      
      if (!groups[gameconsole]) {
        groups[gameconsole] = [];
      }
      groups[gameconsole].push(emu);
    });
    
    return groups;
  };

  const consoleGroups = groupByConsole();
  const totalGames = emulators.filter(emu => !emu.default).length;
  
  // Count filtered games
  const filteredGamesCount = Object.values(consoleGroups)
    .reduce((sum, games) => sum + games.length, 0);

  return (
    <div className="page">
      <h1>Game Library</h1>
      
      <div className="searchContainer">
        <input 
          type="text" 
          placeholder="Search games..." 
          className="searchInput" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="clearSearch" 
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>
      
      <p>
        {searchQuery 
          ? `Showing ${filteredGamesCount} of ${totalGames} games`
          : `Total Games: ${totalGames}`
        }
      </p>
      
      {totalGames === 0 ? (
        <div className="emptyState">
          <p>No games in your library yet.</p>
          <button onClick={() => navigate('/manage-games')}>Add Games</button>
        </div>
      ) : filteredGamesCount === 0 ? (
        <div className="emptyState">
          <p>No games found matching "{searchQuery}"</p>
          <button onClick={() => setSearchQuery('')}>Clear Search</button>
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
                    <button onClick={(e) => { 
                      e.stopPropagation();
                      navigate(`/${game.subpath}`);
                    }}>
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