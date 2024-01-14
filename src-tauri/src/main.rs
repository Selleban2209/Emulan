#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod setting_cache;

use setting_cache::Cache;
use std::fs::File;
use tauri::{Manager, Window, AppHandle};
use std::io::prelude::*;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::ffi::OsStr;
use walkdir::WalkDir;
use serde::{Deserialize, Serialize};
use std::fmt::Display;
use std::io;
use std::fs::read_dir;
use std::fs::{self, DirEntry};
use std::env;

//use sysinfo::{NetworkExt, NetworksExt, ProcessExt, System, SystemExt};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command


#[derive(Serialize)]
pub struct Emulator {
    emulator_name: String,
    path : PathBuf, 
    filetype_support: Vec<String>,
  
}

#[derive(Serialize)]
pub struct Gamerom {
    rom_name: String, 
    rom_extension: String,     
}


//static GBASupport 
static roms: [&str; 3] = ["nds","gba","iso"];

//static load_from_directory:Result<Vec<Emulator>, std::io::Error> = find_emulators_on_startup("C:\\Users\\salle\\Documents\\VisualBoy".to_string());


#[tauri::command]
fn get_extension_from_filename(filename: &str) -> Option<&str> {
    Path::new(filename)
    .extension()
    .and_then(OsStr::to_str)
}

pub fn find_emulators_on_startup( path: String) -> std::io::Result<Vec<Emulator>> {
    let cur_path =read_dir(path);   
    let mut emulator_vec: Vec<Emulator> = Vec::new();
    for entry in cur_path? {
        let path = entry?.path();
        // Get path string.
        let path_str = path.file_name().unwrap();
       // println!("PATH: {}", path_str.to_str().unwrap());
        if !path.is_dir(){
            let filename =  path.file_stem().unwrap();
            println!("PATH2: {}", filename.to_str().unwrap());
            let  mut emu = Emulator {
                emulator_name : String::from(filename.to_str().unwrap()),
                path: PathBuf::from(path),
                filetype_support: Vec::from(Vec::new()),
            };
            if emu.emulator_name == "VisualBoyAdvance" {
            
               emu.filetype_support.push("gba".to_string());
               println!("filetype list: {:?}", emu.filetype_support);
               emulator_vec.push(emu);
               println!("Test vec len {}", emulator_vec.len());
               for item  in emulator_vec.iter() {
                   println!("item in list { }", item.emulator_name);
                   println!("type support: {:?}", item.filetype_support);
                }
            } else if emu.emulator_name == "DeSmuME_0.9.11_x64" {
                emu.filetype_support.push("nds".to_string());
                emulator_vec.push(emu);
                for item  in emulator_vec.iter() {
                }

            }
            

        }


    }    
   // println!("The current directory is {}", cur_path?.to_string().unwrap());
    return Ok(emulator_vec);
}  

/*
pub fn find_emulators_on_startup( path: String) -> std::io::Result<()> {
    1. Kjøre gjennom mappe, finne emulator fil/ mappe(gjør mappe senere), lage struct -->  Nesten ferdig
    2. Fyll liste med emulatorer.
    3.når vi åpner en rom som er .gba skal vi lete gjennom emulatorer som supporter GBA og åpne den deerfra med riktig launch options

}
*/


fn get_current_working_dir() -> std::io::Result<PathBuf> {
    env::current_dir()
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

        let game_rom1 = Gamerom{
            rom_name: String::from(filename),
            rom_extension: String::from(st2),
        };

        let serialized = serde_json::to_string(&game_rom1).unwrap();
    
        app.emit_all("event_name", serialized).unwrap();
    }
    let ok = get_current_working_dir();
    let yes = ok.unwrap().display().to_string();
    let test_direct = find_emulators_on_startup("C:\\Users\\salle\\Documents\\VisualBoy".to_string());

    //println!("test directoy scan {}", test_direct.unwrap().len());
    //let searlized_emulator_list = serde_json::(&test_direct);
    let cache_path =PathBuf::from("C:\\Users\\salle\\Documents\\backyard\\Emulan\\src-tauri\\settings");
    let mut test_cache = Cache::new(cache_path);
    test_cache.create_cache(&path);
  
 
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
        .arg("C:\\Users\\salle\\Documents\\Desmume\\Randomizer\\POKEMON BLACK 2 RANDOMIZE FAZPTR.nds ")
        .spawn()
        .expect("no rustc?");
        
    } else {
        
    }


    let ext= get_extension_from_filename(filename);
    let rom_extension_name = ext.unwrap().to_string();

    println!("################### {}", ext.unwrap().to_string());

    if rom_extension_name == "gba"{
        let test_direct = find_emulators_on_startup("C:\\Users\\salle\\Documents\\VisualBoy".to_string()).unwrap();
        for i in test_direct {

            if i.filetype_support.iter().any(|y| y=="gba"){
                let status = Command::new(i.path)
                .arg(path )
                .spawn()
                .expect("no rustc?");   

                println!("we got here");
                }
            }
    } else if rom_extension_name == "nds" {
        let test_direct = find_emulators_on_startup("C:\\Users\\salle\\Documents\\Desmume".to_string()).unwrap();
        for i in test_direct {

            if i.filetype_support.iter().any(|y| y=="nds"){
                let status = Command::new(i.path)
                .arg(path )
                .spawn()
                .expect("no rustc?");   

                println!("we got here");
                }
            }


    }

//Trenger searlized liste fra front end.





    let x = "testing loop";
     for i in 0..roms.len()  {
         println!("{}", roms[i]);
     }
    
    format!("Path to emulator: {} {}", path, name)
}


//   .arg( "C:\\Users\\salle\\Documents\\Backyard\\Emulan\\src-tauri\\src" ) // <- Specify the directory you'd like to open.
fn main() {
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_saved_path,
            verify_rom
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
