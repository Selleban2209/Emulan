#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod setting_cache;
pub mod game_stats_tracking;
use serde_json::json;
use setting_cache::Cache;
use tauri::api::path::app_data_dir;
use std::fs::File;
use tauri::{AppHandle, Manager, State, Window};
use std::io::prelude::*;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::process::{Child};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::ffi::OsStr;
use walkdir::WalkDir;
use serde::{Deserialize, Serialize};
use std::fmt::Display;
use std::{io, thread};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::fs::{self, DirEntry};
use std::fs::read_dir;
use std::env;


use crate::game_stats_tracking::{ActiveSession, AppState, monitor_process, update_game_last_played};

//use sysinfo::{NetworkExt, NetworksExt, ProcessExt, System, SystemExt};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmulatorConfig {
    emulator_name: String,
    emulator_path : PathBuf, 
    filetype_support: Vec<String>,
  
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmulatorSettings {
    pub emulators: Vec<EmulatorConfig>,
}


#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Gamerom {
    pub rom_id : Option<u32>,
    pub rom_name: String,
    pub rom_path : String,  
    pub rom_filename: Option<String>,
    pub rom_extension: String,   
    pub rom_subpath: Option<String>,
    pub total_playtime_seconds: u64, 
    pub last_played: Option<String>,
/*
    pub date_added: String, // ISO 8601 format
    pub last_played: Option<String>, // Optional - track when last played
*/
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameRomCache {
    pub games: Vec<Gamerom>,
    pub total_count: usize,
}




//static GBASupport, NDSsupport, ISOsupport
static ROMS: [&str; 3] = ["nds","gba","iso"];



fn get_current_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn get_system_time_as_secs(time: SystemTime) -> u64 {
    time.duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_secs()
}

#[tauri::command]
fn format_playtime(seconds: u64) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    
    if hours > 0 {
        format!("{}h {}m", hours, minutes)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, secs)
    } else {
        format!("{}s", secs)
    }
}

#[tauri::command]
fn get_extension_from_filename(filename: &str) -> Option<&str> {
    Path::new(filename)
    .extension()
    .and_then(OsStr::to_str)
}


pub fn find_emulators_in_directory(path: String) -> std::io::Result<Vec<EmulatorConfig>> {
    let cur_path = read_dir(path)?;   
    let mut emulator_vec: Vec<EmulatorConfig> = Vec::new();
    
    for entry in cur_path {
        let path = entry?.path();
        
        if !path.is_dir() {
            let filename = path.file_stem().unwrap();
            let filename_str = filename.to_str().unwrap();
            
            println!("Found file: {}", filename_str);
            
            let mut emu = EmulatorConfig  {
                emulator_name: String::from(filename_str),
                emulator_path: path.clone(),
                filetype_support: Vec::new(),
            };
            
    
            if filename_str.contains("VisualBoyAdvance") || filename_str.contains("gba") {
                emu.emulator_name = "VisualBoyAdvance".to_string();
                emu.filetype_support.push("gba".to_string());
                emulator_vec.push(emu);
            } else if filename_str.contains("DeSmuME") {
                emu.emulator_name = "DeSmuME".to_string();
                emu.filetype_support.push("nds".to_string());
                //emu.filetype_support.push("gba".to_string());
                emulator_vec.push(emu);
            } else if filename_str.contains("Dolphin") || filename_str.contains("dolphin") {
                emu.emulator_name = "Dolphin".to_string();
                emu.filetype_support.push("iso".to_string());
                
                emulator_vec.push(emu);
            }
            // Add more emulator detection here
        }
    }
    
    Ok(emulator_vec)
}




fn get_current_working_dir() -> std::io::Result<PathBuf> {
    env::current_dir()
}

fn test_current_dir(app_handle: AppHandle) -> Result<String, String> {
    let app_dir = app_data_dir(&app_handle.config())
        .ok_or("Failed to get app data directory")?;

    //fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    Ok(app_dir.display().to_string())
}

fn get_app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_data_dir(&app_handle.config())
        .ok_or("Failed to get app data directory".to_string())?;
    
    let app_dir = app_data_dir(&app_handle.config())
        .ok_or("Failed to get app data directory")?;
    
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    Ok(app_dir)
}

fn get_emulator_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app_handle)?.join("emulator_config.json"))
}

fn get_game_cache_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app_handle)?.join("game_roms_cache.json"))
}



#[tauri::command]
fn verify_rom(app_handle: AppHandle ,path:&str, filename:&str) ->String {

    let str_test= get_emulator_config_path(&app_handle);
    println!("testing current dir {:#?}", str_test.clone());
    
    let ext= get_extension_from_filename(filename);

    println!("{:?}", ext);
    if get_extension_from_filename(filename)== Some("exew"){
        println!("oh word uhuh");
    }

    let stringer = ext.unwrap();
    let st2 = &stringer.clone().to_string();
    println!("{} unrwaped string", st2 );
    
    let game_rom1 = Gamerom{
        rom_id : None,
        rom_name: String::from(filename),
        rom_extension: String::from(st2),
        rom_filename: Some(String::from(filename)),
        rom_path: String::from(path),
        rom_subpath: None,
        total_playtime_seconds: 0,
        last_played: None,

    };
    if ROMS.iter().any(|&i| i==st2) {

        println!("Found item in list");
        let serialized = serde_json::to_string(&game_rom1).unwrap();
    
        app_handle.emit_all("event_name", serialized).unwrap();
    }



    //println!("test directoy scan {}", test_direct.unwrap().len());
    //let searlized_emulator_list = serde_json::(&test_direct);

 
    match ext{
        Some("exe")=>println!("YIAH"), 
        _=>println!("default"),
    }

    
    return "".to_string();
}



#[tauri::command]
fn save_emulator_config(
    app_handle: tauri::AppHandle,
    config: EmulatorSettings
) -> Result<(), String> {
    // 1. Get the path (creates directory if needed)
    let config_path = get_emulator_config_path(&app_handle)?;
    
    // 2. Convert your config struct to JSON string
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    // 3. WRITE the file to disk
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}



#[tauri::command]
fn load_emulator_config(app_handle: tauri::AppHandle) -> Result<EmulatorSettings, String> {
    let config_path = get_emulator_config_path(&app_handle)?;
    
    if config_path.exists() {
        let contents = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        let settings: EmulatorSettings = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        
        Ok(settings)
    } else {
        // First run - create default config
        let settings = EmulatorSettings {
            emulators: Vec::new(),
        };
        //save_emulator_config(app_handle, settings.clone())?;
        Ok(settings)
    }
}




// Add a single emulator manually
#[tauri::command]
fn add_emulator_manually(
    app_handle: tauri::AppHandle,
    emulator_path: String,
    emulator_name: String,
    supported_extensions: Vec<String>
) -> Result<(), String> {
    let mut config = load_emulator_config(app_handle.clone())?;
    
    // Check if already exists
    let exists = config.emulators.iter().any(|e| e.emulator_path == PathBuf::from(&emulator_path));
    
    if exists {
        return Err("Emulator already exists in configuration".to_string());
    }
    
    let new_emulator = EmulatorConfig {
        emulator_name,
        emulator_path: PathBuf::from(emulator_path),
        filetype_support: supported_extensions,
    };
    
    config.emulators.push(new_emulator);
    save_emulator_config(app_handle, config)?;
    
    Ok(())
}



#[tauri::command]
fn load_emulators_cache(app_handle: tauri::AppHandle) -> Result<Vec<EmulatorConfig>, String> {
    let config = load_emulator_config(app_handle)?;
    Ok(config.emulators)
}

#[tauri::command]
fn launch_game_with_tracking(
    app_handle: tauri::AppHandle,
    state: State<AppState>,
    rom_path: String,
    rom_name: String,
    rom_extension: String,
) -> Result<String, String> {
    println!("=== Launching Game with Tracking ===");
    println!("ROM: {}", rom_name);
    println!("Path: {}", rom_path);

    
    {
        let sessions = state.active_sessions.lock().unwrap();
        if sessions.contains_key(&rom_path) {
            return Err(format!("'{}' is already running!", rom_name));
        }
    }

    
    if !std::path::Path::new(&rom_path).exists() {
        return Err(format!("ROM file not found: {}", rom_path));
    }

    
    let config = load_emulator_config(app_handle.clone())?;
    let extension = rom_extension.trim_start_matches('.');

    
    let emulator = config.emulators.iter()
        .find(|e| e.filetype_support.iter().any(|ext| ext == extension))
        .ok_or(format!("No emulator configured for .{} files", extension))?;

    
    if !emulator.emulator_path.exists() {
        return Err(format!("Emulator not found at: {:?}", emulator.emulator_path));
    }

    println!("Using emulator: {}", emulator.emulator_name);

    
    let child: Child  = Command::new(&emulator.emulator_path)
        .arg(&rom_path)
        .spawn()
        .map_err(|e| format!("Failed to launch emulator: {}", e))?;

    let process_id = child.id();
    let start_time = SystemTime::now();
    let timestamp = get_current_timestamp();

    println!("Process ID: {}", process_id);
    println!("Start time: {}", timestamp);

    // Create active session
    let session = ActiveSession {
        rom_path: rom_path.clone(),
        rom_name: rom_name.clone(),
        start_time: start_time.clone(),
        process_id,
    };

    // Store active session
    {
        let mut sessions = state.active_sessions.lock().unwrap();
        sessions.insert(rom_path.clone(), session);
    }

    // Update last_played timestamp
    update_game_last_played(app_handle.clone(), rom_path.clone(), timestamp.clone())?;

    // Spawn monitoring thread
    let app_handle_clone = app_handle.clone();
    let state_clone = state.inner().clone();
    let rom_path_clone = rom_path.clone();
    let rom_name_clone = rom_name.clone();

    thread::spawn(move || {
        monitor_process(
            child,
            app_handle_clone,
            state_clone,
            rom_path_clone,
            rom_name_clone,
            start_time,
        );
    });

    Ok(format!("Launched '{}' with {}", rom_name, emulator.emulator_name))
}




#[tauri::command]
fn open_saved_path(
    app_handle: tauri::AppHandle,
    path: &str, 
    name: &str, 
    filename: &str,
    extension: &str
) -> Result<String, String> { 
    println!("Path to open: {} : {}", path, filename);

    // Get the file extension
    let ext = get_extension_from_filename(filename)
        .ok_or("Failed to get file extension")?;
    let rom_extension = ext.to_string();

    println!("ROM extension: {}", rom_extension);

    // Load the emulator configuration
    let config = load_emulator_config(app_handle)?;

    // Find an emulator that supports this file type
    let emulator = config.emulators.iter()
        .find(|e| e.filetype_support.iter().any(|ext| ext == &rom_extension))
        .ok_or(format!("No emulator configured for .{} files. Please configure an emulator in Settings.", rom_extension))?;


    //needs error handling here if no emulator found

    println!("Using emulator: {} at path: {:?}", emulator.emulator_name, emulator.emulator_path);

    // Launch the emulator with the ROM
    std::process::Command::new(&emulator.emulator_path)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to launch emulator: {}", e))?;

    Ok(format!("Launched {} with {}", name, emulator.emulator_name))
}

// Game ROM Cache Functions

#[tauri::command]
fn load_games_cache(app_handle: tauri::AppHandle) -> Result<GameRomCache, String> {
    println!("Loading game cache from disk...");
    read_game_cache(&app_handle)
}

fn read_game_cache(app_handle: &tauri::AppHandle) -> Result<GameRomCache, String> {
    let cache_path = get_game_cache_path(app_handle)?;
    
    if cache_path.exists() {
        let contents = fs::read_to_string(&cache_path)
            .map_err(|e| format!("Failed to read game cache: {}", e))?;
        
        let cache: GameRomCache = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse game cache: {}", e))?;
        
        Ok(cache)
    } else {
        Ok(GameRomCache {
            games: Vec::new(),
            total_count: 0,
        })
    }
}

pub fn save_games_cache(app_handle: &tauri::AppHandle, cache: &GameRomCache) -> Result<(), String> {
    let cache_path = get_game_cache_path(app_handle)?;
    
    let json = serde_json::to_string_pretty(&cache)
        .map_err(|e: serde_json::Error| format!("Failed to serialize game cache: {}", e))?;
    
    
    fs::write(&cache_path, json)
        .map_err(|e| format!("Failed to write game cache: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn clear_game_cache(app_handle: tauri::AppHandle) -> Result<(), String> {

    let cache_path = get_game_cache_path(&app_handle)?;
    println!("CLEARING CACHE FILE AT: {}", cache_path.display());
    
    let empty_cache = json!({
        "games": [],
        "total_count": 0
    });

    let json_string = serde_json::to_string_pretty(&empty_cache)
        .map_err(|e| format!("Failed to serialize empty cache: {}", e))?;

    fs::write(&cache_path, json_string)
        .map_err(|e| format!("Failed to write cache file: {}", e))?;

    Ok(())
}


#[tauri::command]
fn add_games_to_cache(
    app_handle: tauri::AppHandle,
    roms: Vec<Gamerom>
) -> Result<Vec<Gamerom>, String> {
    println!("Adding {} games to cache...", roms.len());
    
    let mut cache = read_game_cache(&app_handle)?;
    let mut added_games = Vec::new();
    
    for rom in roms {
        // Check if game already exists (by path)
        let exists = cache.games.iter().any(|r| r.rom_path == rom.rom_path);
        
        if !exists {
            println!("Adding new game: {}", rom.rom_name);
            added_games.push(rom.clone());
            cache.games.push(rom);
        } else {
            println!("Game already exists, skipping: {}", rom.rom_name);
        }
    }
    
    if !added_games.is_empty() {
        cache.total_count = cache.games.len();
        save_games_cache(&app_handle, &cache)?;
        println!("Successfully added {} games", added_games.len());
    } else {
        println!("No new games to add");
    }
    
    Ok(added_games)
}



#[tauri::command]
fn scan_for_games(current_dir : Option<&str>) -> Vec<Gamerom> {

    let mut game_roms: Vec<Gamerom> = Vec::new();
    let scan_path = match current_dir {
        Some(dir) => PathBuf::from(dir),
        None => env::current_dir().unwrap(),
    };
    println!("Scanning for games at {:?}", scan_path);

    for entry in WalkDir::new(scan_path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension().and_then(OsStr::to_str) {
                //print!("Found file with extension: {}\n", ext);
                if ROMS.contains(&ext) {
                    let rom = Gamerom {
                        rom_id : None,
                        rom_name: entry.file_name().to_string_lossy().to_string(),
                        rom_extension: ext.to_string(),
                        rom_filename: Some(entry.file_name().to_string_lossy().to_string()),
                        rom_path: entry.path().to_string_lossy().to_string(),
                        rom_subpath: None,
                        total_playtime_seconds: 0,
                        last_played: None,
                    };
                    game_roms.push(rom);
                }
            }
        }
    }

    for rom in &game_roms {
        println!("Found ROM: {} at {}", rom.rom_name, rom.rom_path);
    }

    game_roms
}




#[tauri::command]
fn get_active_sessions(state: State<AppState>) -> Result<Vec<(String, String, u64)>, String> {
    let sessions = state.active_sessions.lock().unwrap();
    
    let result: Vec<(String, String, u64)> = sessions.values()
        .map(|session| {
            let elapsed = SystemTime::now()
                .duration_since(session.start_time)
                .unwrap_or(Duration::from_secs(0))
                .as_secs();
            
            (session.rom_path.clone(), session.rom_name.clone(), elapsed)
        })
        .collect();
    
    Ok(result)
}

#[tauri::command]
fn get_recently_played_games(
    app_handle: tauri::AppHandle,
    limit: usize,
) -> Result<Vec<Gamerom>, String> {
    let cache = read_game_cache(&app_handle)?;
    
    let mut games: Vec<Gamerom> = cache.games.into_iter()
        .filter(|g| g.last_played.is_some())
        .collect();
    

    games.sort_by(|a, b| {
        b.last_played.as_ref().unwrap_or(&String::new())
            .cmp(a.last_played.as_ref().unwrap_or(&String::new()))
    });
    
    games.truncate(limit);
    
    Ok(games)
}

#[tauri::command]
fn get_most_played_games(
    app_handle: tauri::AppHandle,
    limit: usize,
) -> Result<Vec<Gamerom>, String> {
    let cache = read_game_cache(&app_handle)?;
    
    let mut games: Vec<Gamerom> = cache.games;
    
    // Sort by total playtime (most played first)
    games.sort_by(|a, b| b.total_playtime_seconds.cmp(&a.total_playtime_seconds));
    
    games.truncate(limit);
    
    Ok(games)
}

#[tauri::command]
fn get_game_stats(
    app_handle: tauri::AppHandle,
    rom_path: String,
) -> Result<Gamerom, String> {
    let cache = read_game_cache(&app_handle)?;
    
    cache.games.into_iter()
        .find(|g| g.rom_path == rom_path)
        .ok_or(format!("Game not found: {}", rom_path))
}





fn main() {
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_saved_path,
            verify_rom, 
            save_emulator_config,
            load_emulator_config,
            add_emulator_manually,
            launch_game_with_tracking,

            get_active_sessions,
            get_recently_played_games,  
            get_most_played_games,
            get_game_stats,
            format_playtime,

            
            add_games_to_cache,
            load_games_cache,
            clear_game_cache,

            load_emulators_cache,
            scan_for_games
            ])
        .manage(app_state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
