use serde::{Deserialize, Serialize};
use std::env;
use dotenv::dotenv;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudConfig {
    pub account_id: String,
    pub access_key_id: String,
    pub access_key_secret: String,
    pub bucket_name: String,
}


/*

*/
impl CloudConfig {
    pub fn from_env() -> Result<Self, String> {
        dotenv().ok();
        Ok(Self {
            account_id: std::env::var("R2_ACCOUNT_ID")
                .map_err(|_| "R2_ACCOUNT_ID not set")?,
            access_key_id: std::env::var("R2_ACCESS_KEY_ID")
                .map_err(|_| "R2_ACCESS_KEY_ID not set")?,
            access_key_secret: std::env::var("R2_ACCESS_KEY_SECRET")
                .map_err(|_| "R2_ACCESS_KEY_SECRET not set")?,
            bucket_name: std::env::var("R2_BUCKET_NAME")
                .unwrap_or_else(|_| "emulator-library".to_string()),
        })
    }

    pub fn endpoint_url(&self) -> String {
        format!("https://{}.r2.cloudflarestorage.com", self.account_id)
    }
}