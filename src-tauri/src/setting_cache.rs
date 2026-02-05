use std::io;
use std::fs::File;
use std::io::Read;
use std::fs::DirEntry;
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::{BufReader, Write};
use std::sync::{Arc, Mutex};
use std::path::{Path, PathBuf};
use toml;
use serde_json;

pub struct Cache {
    cache_file_path: PathBuf,
    folder_path:  Option<PathBuf>,
    data: HashMap<String, String>,

}

impl Cache {
    pub fn new(cache_file_path: PathBuf) -> Self {
        Self{
            cache_file_path,
            folder_path: None,
            data: HashMap::new(),
        }
    }
    
      // Save file paths to the cache file
    pub fn create_cache(&mut self, rom_file_path: &str) -> io::Result<()> {
   
        Ok(())
    }

       // Load file paths from the cache file
    fn load_cache(&mut self) -> io::Result<()> {
        if self.cache_file_path.exists() {
            let mut cache_file = File::open(&self.cache_file_path).expect("Failed to open cache file");
            let reader = BufReader::new(cache_file);

            if let Ok(decompressed) = zstd::decode_all(reader) {

            }
        
        } else {
            // If the file doesn't exist, create an empty cache
            
        }
        Ok(())
    }



    // Save file paths to the cache file
    pub fn save_cache(&self, rom_file_path: &str) -> io::Result<()> {
        let settings_toml = toml::to_string_pretty(&rom_file_path).unwrap();

      
 
        Ok(())
    }

    fn get(&self, key: &str) -> Option<&String> {
        self.data.get(key)
    }

    fn set(&mut self, key: String, value: String) {
        self.data.insert(key, value);
    }
}




  




       /*
       file.write_all(

            &zstd::encode_all(serialized_cache.as_bytes(), 0)
               .expect("Failed to compress cache contents.")
       ).unwrap();

        // Write the compressed data to the file
        //let mut file = File::create(&self.cache_file_path)?;
*/
        