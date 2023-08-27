#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs::File;
use tauri::{Manager, Window, AppHandle};
use std::io::prelude::*;
use std::path::Path;
use std::process::Command;
use std::ffi::OsStr;
use std::fmt::Display;
use std::env;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct Emulator {
    name: String,
}


struct Gamerom {
    rom_name: String, 
    rom_extension: String, 
    

}


static roms: [&str; 3] = ["nds","gba","iso"];

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn get_extension_from_filename(filename: &str) -> Option<&str> {
    Path::new(filename)
        .extension()
        .and_then(OsStr::to_str)
}




#[tauri::command]
fn verify_rom(app: AppHandle ,path:&str, filename:&str) ->String {

    let ext= get_extension_from_filename(filename);

    println!("{:?}", ext);
    if get_extension_from_filename(filename)== Some("exew"){
        println!("oh word uhuh");
        
    }

    let stringer = ext.unwrap();
    let st2 = stringer.to_string();
    println!("{} unrwaped string", st2 );
    if roms.iter().any(|&i| i==st2) {

        println!("Found item in list");

        let mut game_rom1 = Gamerom{
            rom_name: String::from(filename),
            rom_extension: String::from(st2),
        };
    
        app.emit_all("event_name", "eventpayload").unwrap();
    }


    match ext{
        Some("exe")=>println!("YIAH") , 
        _=>println!("default"),
    }

    return "".to_string();
}





#[tauri::command]
fn open_saved_path(path: &str, name:&str, filename:&str)-> String{ 
    
    

    if name == "VisualBoyAdvance" {
        let status = Command::new(path)
        .arg("C:\\Users\\salle\\Documents\\VisualBoy\\Pokemon - Emerald rouge 1.3.2 EX.gba")
        .spawn()
        .expect("no rustc?");
    } else if name == "DeSmuME_0.9.11_x64" {
        let status = Command::new(path)
        .arg("C:\\Users\\salle\\Documents\\Desmume\\Randomizer\\POKEMON BLACK 2 RANDOMIZE FAZPTR.nds")
        .spawn()
        .expect("no rustc?");
        
    } else {
        let status = Command::new(path)
        .spawn()
        .expect("no rustc?");  

    }


    let x = "testing loop";
     for i in 0..roms.len()  {
         println!("{}", roms[i]);
     }
    
    format!("Path to emulator: {} {}", path, name)
}

#[tauri::command]
fn test_path(path: &str)-> String{
    format!("Open File {}", path)
}

//   .arg( "C:\\Users\\salle\\Documents\\Backyard\\Emulan\\src-tauri\\src" ) // <- Specify the directory you'd like to open.
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, open_saved_path, test_path,verify_rom])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
