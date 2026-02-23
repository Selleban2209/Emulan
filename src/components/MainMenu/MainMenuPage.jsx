import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { useNavigate } from 'react-router-dom';

import "./MainMenuPage.css";

function MainMenuPage({ games , activeSessions}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    loadRecentlyPlayed(); 
  }, [games]);  


  const loadRecentlyPlayed = async () => {
    try {
      setLoadingRecent(true);
      const recent = await invoke('get_recently_played_games', { limit: 5 });
      setRecentlyPlayed(recent);
      console.log('Loaded recently played:', recent);
    } catch (error) {
      console.error('Failed to load recently played games:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const groupByConsole = () => {
    const groups = {};
    
    games.forEach(game => {
      if (game.default) return;
      
      if (searchQuery && !game.rom_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return; 
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

  const playGame = async (game) => {
      navigate(`/${game.rom_subpath}`);
  };
  const isGameActive = (romPath) => {
    return activeSessions?.some(([path]) => path === romPath);
  };

  const consoleGroups = groupByConsole();

  const totalGames = games.filter(game => !game.default).length;

  const formatPlaytime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatLastPlayed = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
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
      
      <div className="addGamesContainer">
        <button className="addGamesButton" onClick={() => navigate('/manage-games')}>Add Games</button>
      </div>

      {!loadingRecent && recentlyPlayed.length > 0 &&  !searchQuery && (
        
        <div className="recentlyPlayedSection">
          <div className="sectionHeader">
            <h2>Recently Played</h2>
            <button 
              className="viewAllButton"
              onClick={() => {/* Optional: navigate to stats page */}}
            >
              View All →
            </button>
          </div>
          
          <div className="recentlyPlayedStrip">
            {recentlyPlayed.map((game) => {
              const isActive = isGameActive(game.rom_path);
              
              return (
                <div
                  key={game.rom_path}
                  className={`recentGameCard ${isActive ? 'playing' : ''}`}
                  onClick={() => playGame(game)}
                >
                  
                  <div className="recentGameThumbnail">
                    <div className="thumbnailPlaceholder">
                      <span className="gameInitial">
                        {game.rom_id}
                      </span>
                    </div>
                    {isActive && (
                      <div className="playingBadge">
                        <span className="pulseDot"></span>
                        PLAYING
                      </div>
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="recentGameInfo">
                    <h4 className="recentGameTitle">{game.rom_name}</h4>
                    
                    <div className="recentGameMeta">
                      <div className="metaItem">
                        <span className="metaIcon">⏱️</span>
                        <span className="metaText">
                          {formatPlaytime(game.total_playtime_seconds)}
                        </span>
                      </div>
                      
                   
                    </div>

                    <div className="lastPlayedText">
                      {formatLastPlayed(game.last_played)}
                    </div>
                  </div>

                  
                  <div className="recentGameOverlay">
                    <button className="playOverlayButton">
                      ▶ {isActive ? 'View' : 'Play'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
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
      
        </div>
      )}
    </div>
  );
}

export default MainMenuPage;