import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import "./EmulatorInstance.css";
import * as logos from "../../assets/export";

function EmulatorInstance({ game }) {
    const [errorMsg, setErrorMsg] = useState("");
    const [gameStats, setGameStats] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sessionTime, setSessionTime] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGameStats();
        setupEventListeners();
        checkIfGameIsRunning();

        // Update session time every second if game is running
        const interval = setInterval(() => {
            if (isPlaying) {
                setSessionTime(prev => prev + 1);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [game.rom_path, isPlaying]);

    const loadGameStats = async () => {
        try {
            const stats = await invoke('get_game_stats', {
                romPath: game.rom_path
            });
            setGameStats(stats);
            console.log('Game stats:', stats);
        } catch (error) {
            console.error('Failed to load game stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupEventListeners = async () => {
        // Listen for when this specific game's session ends
        const unlisten = await listen('game-session-ended', (event) => {
            const session = event.payload;
            if (session.rom_path === game.rom_path) {
                console.log('This game session ended:', session);
                setIsPlaying(false);
                setSessionTime(0);
                loadGameStats(); // Reload stats to show updated playtime
            }
        });

        return unlisten;
    };

    const checkIfGameIsRunning = async () => {
        try {
            const activeSessions = await invoke('get_active_sessions');
            const thisGameRunning = activeSessions.find(
                ([path, name, elapsed]) => path === game.rom_path
            );
            
            if (thisGameRunning) {
                setIsPlaying(true);
                setSessionTime(thisGameRunning[2]); // elapsed time in seconds
            }
        } catch (error) {
            console.error('Failed to check active sessions:', error);
        }
    };

    async function openSavedPath() {
        if (isPlaying) {
            setErrorMsg("Game is already running!");
            return;
        }

        console.log("LAUNCHING with tracking!");
        console.log("Filename:", game.rom_filename);
        console.log("Extension:", game.rom_extension);
        
        setLoading(true);
        setErrorMsg("");

        try {
            const message = await invoke("launch_game_with_tracking", {
                romPath: game.rom_path,
                romName: game.rom_name,
                romExtension: game.rom_extension || game.rom_filename.split('.').pop()
            });

            console.log(message);
            setErrorMsg(message);
            setIsPlaying(true);
            setSessionTime(0);
            
            // Reload stats to update play count
            await loadGameStats();
        } catch (error) {
            console.error('Launch error:', error);
            setErrorMsg(String(error));
        } finally {
            setLoading(false);
        }
    }

    async function verifyRom() {
        console.log("Verifying ROM:", game.rom_filename, game.rom_extension);
        
        try {
            const message = await invoke("verify_rom", {
                path: game.rom_path,
                filename: game.rom_filename
            });
            console.log(message);
            setErrorMsg(message);
        } catch (error) {
            console.error('Verify error:', error);
            setErrorMsg(String(error));
        }
    }

    function RenderPlatform() {
        switch (game.rom_name) {
            case "Project64": 
                return (
                    <>
                        <p>N64</p>
                        <img src={logos.nintendo64Logo} alt="N64" />
                    </>
                );
            case "DeSmuME_0.9.11_x64": 
                return (
                    <>
                        <p>NDS</p>
                        <img 
                            src={logos.NDSLogo} 
                            alt="NDS" 
                            style={{width:"90px", height:"20px"}}
                        />
                    </>
                );
            default: 
                return <p>Platform</p>;
        }
    }

    const formatPlaytime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    return (
        <div className="instance-div">
            <div className="game-header">
                <h2>{game.rom_name}</h2>
                <RenderPlatform />
            </div>

            {/* Game Statistics */}
            {gameStats && (
                <div className="game-stats-section">
                    <h3>Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Playtime:</span>
                            <span className="stat-value">
                                {formatPlaytime(gameStats.total_playtime_seconds)}
                            </span>
                        </div>
                        <div className="stat-item">
                            
                            <span className="stat-value">{gameStats.play_count}</span>
                        </div>
                        {gameStats.last_played && (
                            <div className="stat-item">
                                <span className="stat-label">Last Played:</span>
                                <span className="stat-value">
                                    {new Date(gameStats.last_played).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Current Session Info */}
            {isPlaying && (
                <div className="current-session">
                    <div className="now-playing">
                        <span className="pulse-dot"></span>
                        <span>Now Playing</span>
                    </div>
                    <div className="session-timer">
                        Session Time: {formatPlaytime(sessionTime)}
                    </div>
                </div>
            )}

            {/* Game Actions */}
            <div className="game-actions">
                <button 
                    className="verifyBtn" 
                    onClick={verifyRom}
                    disabled={loading || isPlaying}
                >
                    Verify ROM
                </button>
                <button 
                    className="openBtn" 
                    onClick={openSavedPath}
                    disabled={loading || isPlaying}
                >
                    {isPlaying ? 'Already Running...' : 'Launch Game'}
                </button>
            </div>

            {/* Game Info */}
            <div className="game-info">
                <p className="game-id">Game ID: {game.rom_id}</p>
                <p className="game-path">Path: {game.rom_path}</p>
            </div>

            {/* Error/Status Messages */}
            {errorMsg && (
                <div className={`message ${errorMsg.includes('Failed') ? 'error' : 'success'}`}>
                    {errorMsg}
                </div>
            )}
        </div>
    );
}

export default EmulatorInstance;