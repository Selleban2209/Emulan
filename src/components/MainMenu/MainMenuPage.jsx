import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./MainMenuPage.css";

function MainMenuPage({ games }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group games by console type based on extension
  const groupByConsole = () => {
    const groups = {};
    
    games.forEach(game => {
      if (game.default) return;
      
      
      // Filter by search query
      if (searchQuery && !game.rom_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return; // Skip games that don't match search
      }
      
      
      // Normalize extension
      const ext = game.rom_extension?.toLowerCase().replace('.', '');

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
      groups[gameconsole].push(game);
    });
    
    return groups;
  };

  const consoleGroups = groupByConsole();
  const totalGames = games.filter(game => !game.default).length;

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
                  <div key={game.rom_id} className="gameCard" onClick={() => navigate(`/${game.rom_subpath}`)}>
                    <h3>{game.rom_name}</h3>
                    <p className="gamePath">{game.rom_name}</p>
                    <button onClick={(e) => { 
                      e.stopPropagation();
                      navigate(`/${game.rom_subpath}`);
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