
use aws_sdk_s3::{self as s3, config::Credentials, primitives::ByteStream};
use std::path::Path;
use std::fs;
use std::io::Write;
use tauri::Window;
use crate::cloud::cloud_config::CloudConfig;

pub struct R2Client {
    client: s3::Client,
    config: CloudConfig,
}

impl R2Client {
    pub async fn new(config: CloudConfig) -> Self {
        let aws_config = aws_config::from_env()
            .endpoint_url(config.endpoint_url())
            .credentials_provider(Credentials::new(
                config.access_key_id.clone(),
                config.access_key_secret.clone(),
                None,
                None,
                "R2",
            ))
            .region("auto")
            .load()
            .await;

        let client = s3::Client::new(&aws_config);

        Self { client, config }
    }

    pub fn client(&self) -> &s3::Client {
        &self.client
    }

    pub fn bucket(&self) -> &str {
        &self.config.bucket_name
    }
}