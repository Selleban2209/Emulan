

use serde_json::json;


use crate::setting_cache::Cache;


use crate::{read_game_cache, save_games_cache};
use tauri::api::path::app_data_dir;
use std::fs::File;
use tauri::{Manager, Window, AppHandle};
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
use std::io;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::fs::{self, DirEntry};
use std::fs::read_dir;
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaySession {
    pub rom_path: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_seconds: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct ActiveSession {
    pub rom_path: String,
    pub rom_name: String,
    pub start_time: SystemTime,
    pub process_id: u32,
}


#[derive(Debug, Clone)]
pub struct AppState {
    pub active_sessions: Arc<Mutex<HashMap<String, ActiveSession>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}



// ========== HELPER FUNCTIONS ==========

fn get_current_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn get_system_time_as_secs(time: SystemTime) -> u64 {
    time.duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_secs()
}


pub fn monitor_process(
    mut child: Child,
    app_handle: tauri::AppHandle,
    state: AppState,
    rom_path: String,
    rom_name: String,
    start_time: SystemTime,
) {
    println!("Started monitoring process for: {}", rom_name);

    // Wait for process to exit
    match child.wait() {
        Ok(status) => {
            let end_time = SystemTime::now();
            let duration = end_time.duration_since(start_time)
                .unwrap_or(Duration::from_secs(0));
            let duration_secs = duration.as_secs();

            println!("Process exited with status: {}", status);
            println!("Duration: {} seconds ({} minutes)", duration_secs, duration_secs / 60);

            // Remove from active sessions
            {
                let mut sessions = state.active_sessions.lock().unwrap();
                sessions.remove(&rom_path);
            }

            // Update playtime in cache
            if let Err(e) = update_game_playtime(
                app_handle.clone(),
                rom_path.clone(),
                duration_secs,
            ) {
                eprintln!("Failed to update playtime: {}", e);
            }

            // Emit event to frontend
            let _ = app_handle.emit_all("game-session-ended", PlaySession {
                rom_path: rom_path.clone(),
                start_time: get_current_timestamp(),
                end_time: Some(get_current_timestamp()),
                duration_seconds: Some(duration_secs),
            });

            println!("Session trackinFgg completed for: {}", rom_name);
        }
        Err(e) => {
            eprintln!("Error waiting for process: {}", e);
            
            // Remove from active sessions
            let mut sessions = state.active_sessions.lock().unwrap();
            sessions.remove(&rom_path);
        }
    }
}

// ========== CACHE UPDATE FUNCTIONS ==========

pub fn update_game_last_played(
    app_handle: tauri::AppHandle,
    rom_path: String,
    timestamp: String,
) -> Result<(), String> {
    let mut cache = read_game_cache(&app_handle)?;

    if let Some(game) = cache.games.iter_mut().find(|g| g.rom_path == rom_path) {
        game.last_played = Some(timestamp);
       
    }

    save_games_cache(&app_handle, &cache)?;
    Ok(())
}

pub fn update_game_playtime(
    app_handle: tauri::AppHandle,
    rom_path: String,
    duration_seconds: u64,
) -> Result<(), String> {
    let mut cache = read_game_cache(&app_handle)?;

    if let Some(game) = cache.games.iter_mut().find(|g| g.rom_path == rom_path) {
        game.total_playtime_seconds += duration_seconds;
        
        println!("Updated playtime for '{}': {} total seconds ({} hours)", 
            game.rom_name, 
            game.total_playtime_seconds,
            game.total_playtime_seconds / 3600
        );
    }

    save_games_cache(&app_handle, &cache)?;
    Ok(())
}
