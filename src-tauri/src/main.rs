#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs::File;
use std::io::prelude::*;
use std::path::Path;
use std::process::Command;
use std::env;
// Prevents additional console window on Windows in release, DO NOT REMOVE!!


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn openem(name: &str) -> String {
    let path = Path::new("src/DeSmuME_0.9.11_x64.exe");
    let display = path.display();
    // Open the path in read-only mode, returns `io::Result<File>`
    let mut file = match File::open(&path) {
        Err(why) => panic!("couldn't open {}: {}", display, why),
        Ok(file) => file,
    };
    format!("Open File {}", name)
}

#[tauri::command]
fn filex(){
    println!( "Opening" );
    Command::new( "explorer" )
    .arg( ".\\src" ) // <- Specify the directory you'd like to open.
    .spawn( )
    .unwrap( );
    open::with(".\\src\\try.txt", "explorer");
}


#[tauri::command]
fn open_saved_path(path: &str)-> String{ 
    let status = Command::new(path)
    .arg("")
    .status()
    .expect("no rustc?");
    
    format!("cool {} code {}", status.success(), status.code().unwrap())
}

#[tauri::command]
fn test_path(path: &str)-> String{
    format!("Open File {}", path)
}

//   .arg( "C:\\Users\\salle\\Documents\\Backyard\\Emulan\\src-tauri\\src" ) // <- Specify the directory you'd like to open.
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, openem,filex, open_saved_path, test_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
