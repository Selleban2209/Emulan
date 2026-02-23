import  React, { useEffect } from "react";
import { useState, useRef, createRef , path} from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { useNavigate, Route, Routes, Router } from "react-router-dom";
import { EmulatorInstance , SideMenu, GameView,ManageGamesPage, SettingsPage , MainMenuPage, EmulatorManagementPage} from "./components/export";
import {open, save ,  } from  "@tauri-apps/api/dialog";
import { listen } from '@tauri-apps/api/event'
import { basename, resolveResource ,extname} from '@tauri-apps/api/path';
import "./App.css";

function App() {
  const navigate = useNavigate();
  const [id, setId] = useState(1);
  const [games, setGames] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeSessions, setActiveSessions] = useState([]);
  useEffect(() => {
    loadGamesFromCache();
    setupEventListeners();
    startSessionPolling();
    
    
    return () => { };
  }, []);
  

  const setupEventListeners = async () => {
    
    const unlisten = await listen('game-session-ended', (event) => {
      console.log('Game session ended:', event.payload);
      loadGamesFromCache();
      loadActiveSessions();
    });

    return unlisten;
  };

  const startSessionPolling = () => {
    
    const interval = setInterval(() => {
      loadActiveSessions();
    }, 10000);

    return () => clearInterval(interval);
  };

  const loadActiveSessions = async () => {
    try {
      const sessions = await invoke('get_active_sessions');
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  };



  const loadGamesFromCache = async () => {
    console.log("Loading games from cache...");
    setLoading(true);
    setError(null);
    
    try {
      const cache = await invoke('load_games_cache');
      console.log(`Loaded ${cache.games.length} games from cache`);
      setGames(cache.games);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError('Failed to load game library');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGames = async (newGames) => {
    console.log(`Adding ${newGames} games...`);
    

    const formattedGames = newGames.map((game, index) => ({    
      rom_id: id + index,
      rom_name: game.rom_name || game.name,
      rom_path: game.rom_path || game.path,
      rom_filename: game.rom_filename,
      rom_extension: game.rom_extension || game.extension,
      rom_subpath: (game.rom_name || game.name).replace(/\s+/g, '-'),
      total_playtime_seconds: 0,
      last_played: null,
     // date_added: new Date().toISOString(),
     // last_played: null
    }));

    console.log("Formatted games to add:", formattedGames);

    try {
      
      const addedGames = await invoke('add_games_to_cache', { 
        roms: formattedGames 
      });
      console.log("Added games:", addedGames);

      if (addedGames.length > 0) {
        setGames(prevGames => [...prevGames, ...addedGames]);
        setId(prevId => prevId + addedGames.length);
      }
      console.log("Updated games list:", games);
    } catch (err) {
      console.error('Failed to add games:', err);
      
      await loadGamesFromCache();
      throw err;
    }
  };


  return (
    <div className="container">
      <div className="headerMenu">
        <button onClick={()=> navigate('/')} className="homeButton">Games Library</button>
        <button onClick={()=> navigate('/settings')} className="settingsButton">Settings</button>  
        <button onClick={()=> navigate('/manage-games')} className="manageGamesButton">Manage Games</button>
        <button onClick={()=> navigate('/manage-emulators')} className="manageEmulatorsButton">Manage Emulators</button>
      </div>
      <div className="flexBox">
       
        <div className="sideMenu">
          
        </div>
        <div className="emulatorTab">
          <Routes>
            <Route path="/" element={<MainMenuPage games={games} activeSessions={activeSessions} />} />
            <Route path="/manage-games" element={<ManageGamesPage handleAddGames={handleAddGames} />} />
            <Route path="/settings" element={<SettingsPage games={games} setGames={setGames}  setId ={setId} />} />
            <Route path="/manage-emulators" element={<EmulatorManagementPage />} />
            {games.map((game) => (   
              <Route  path={`/${game.rom_subpath}`} element={<EmulatorInstance game={game} />} />
            ))}   
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
          