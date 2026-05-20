// src-tauri/src/cloud/mod.rs
pub mod client;
pub mod cloud_config;

use serde::{Deserialize, Serialize};

use crate::Gamerom;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudGame {
    pub game_rom: Gamerom,
    pub file_name: String,
    pub file_size: u64,
    pub uploaded_at: String,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub file_name: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f64,
}