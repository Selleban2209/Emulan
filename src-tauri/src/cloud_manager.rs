use aws_config::SdkConfig;
use aws_sdk_s3::{self as s3, primitives::ByteStream};
use aws_smithy_types::date_time::Format::DateTime;
use std::path::Path;
use std::fs;
use std::io::Write;
use dotenv::dotenv;
use crate::{Gamerom, cloud::{self, CloudGame, cloud_config::{self, CloudConfig}}};
use md5::{Md5, Digest};

#[derive(Debug, Clone)]
pub struct CloudStorage {

   pub  client: s3::Client,
   pub  bucket: String,
}

impl CloudStorage {
pub async fn new(cloud_credentials: CloudConfig) -> Self {
     
    let config = aws_config::from_env()
        .endpoint_url(format!("https://{}.r2.cloudflarestorage.com", cloud_credentials.account_id))
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            cloud_credentials.access_key_id,
            cloud_credentials.access_key_secret,
            None,
            None,
            "R2",
        ))
        .region("auto") // Required by SDK but not used by R2
        .load()
        .await;

        let client = s3::Client::new(&config);
        Self {
            client,
            bucket: cloud_credentials.bucket_name.clone(),
        }
    }



        
    pub async fn upload_game_rom(
        &self,
        game_rom: &Gamerom,
    ) -> Result<CloudGame, String> {
        println!("Starting upload for: {}", game_rom.rom_path);

        // Get file info
        let path = Path::new(&game_rom.rom_path);
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .ok_or("Invalid file name")?;

        let metadata = fs::metadata(&game_rom.rom_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        let file_size = metadata.len();

        // Create S3 key: games/{platform}/{game_id}/{filename}

        //Rust funny langauge haha
        let game_id = game_rom.rom_id.map(|id| id.to_string()).unwrap_or_else(|| "unknown".to_string());

        let key = format!("games/{}/{}/{}", game_rom.rom_extension, game_id, file_name);

        println!("Uploading to: {}", key);

        // Read file and upload
        let body = ByteStream::from_path(path).await
            .map_err(|e| format!("Failed to read file: {}", e))?;

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(&key)
            .body(body)
            .content_type("application/octet-stream")
            .send()
            .await
            .map_err(|e| format!("Upload failed: {}", e))?;

        println!("Upload complete!");

        // Create metadata
        let game = CloudGame {
            game_rom: game_rom.clone(),
            file_name: game_rom.rom_name.to_string(),
            file_size,
            uploaded_at: chrono::Utc::now().to_rfc3339(),
        };

      
        let metadata_key = format!("games/{}/{}/metadata.json", game_rom.rom_extension, game_id);
        let metadata_json = serde_json::to_string(&game)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(&metadata_key)
            .body(ByteStream::from(metadata_json.into_bytes()))
            .content_type("application/json")
            .send()
            .await
            .map_err(|e| format!("Failed to upload metadata: {}", e))?;

        println!("Metadata saved");
        Ok(game)
    }

    
}

pub async fn cloud_test() -> Result<CloudStorage, s3::Error> {
    dotenv().ok();
 
    let cloud_credentials  = CloudConfig::from_env().expect("Failed to load CloudConfig from environment variables");
     // Configure the client
    let cloud_storage = CloudStorage::new(cloud_credentials).await; 
    
 
    
  
    let bucket_tests = test_cloud_connection(&cloud_storage.client);
    println!("Cloud connection test result:\n{}", bucket_tests.await.unwrap_or_else(|e| format!("Error: {}", e)));
    

    Ok(cloud_storage)
}

pub fn calculate_md5( file_path: &str) -> Result<String, Box<dyn std::error::Error>> {
        
        
        let contents = fs::read(file_path)?;
        let mut hasher = Md5::new();
        hasher.update(&contents);
        let result = hasher.finalize();
        
        Ok(format!("{:x}", result))
    }

pub async fn test_cloud_connection(cloud_client: &s3::Client) -> Result<String, String> {
    println!("Testing connection...");
    let resp = cloud_client.list_buckets().send().await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let mut bucket_list = String::from("Connected! Buckets:\n");
    for bucket in resp.buckets() {
        let name = bucket.name().unwrap_or("unnamed");
        bucket_list.push_str(&format!("  - {}\n", name));
    }

    Ok(bucket_list)
}

        



async fn download_object(
    client: &s3::Client,
    bucket: &str,
    key: &str,
    output_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let resp = client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;

    let data = resp.body.collect().await?;
    let bytes = data.into_bytes();

    let mut file = fs::File::create(output_path)?;
    file.write_all(&bytes)?;

    println!("Downloaded {}/{} to {}", bucket, key, output_path);
    Ok(())
}