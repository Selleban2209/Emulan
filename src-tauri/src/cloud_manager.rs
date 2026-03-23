use aws_sdk_s3 as s3;
use aws_smithy_types::date_time::Format::DateTime;

pub async fn cloud_test() -> Result<(), s3::Error> {
    println!("Starting Cloudflare R2 test...");
    let bucket_name = "sdk-example";
    
     // Provide your Cloudflare account ID
    let account_id = "<ACCOUNT_ID>";
  
    let access_key_id = "<ACCESS_KEY_ID>";
    let access_key_secret = "<SECRET_ACCESS_KEY>";

     // Configure the client
    let config = aws_config::from_env()
        .endpoint_url(format!("https://{}.r2.cloudflarestorage.com", account_id))
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            access_key_id,
            access_key_secret,
            None, // session token is not used with R2
            None,
            "R2",
        ))
        .region("auto") // Required by SDK but not used by R2
        .load()
        .await;

    let client = s3::Client::new(&config);


    let list_buckets_output = client.list_buckets().send().await?;

    println!("Buckets:");
    for bucket in list_buckets_output.buckets() {
        println!("  - {}: {}",
            bucket.name().unwrap_or_default(),
            bucket.creation_date().map_or_else(
                || "Unknown creation date".to_string(),
                |date| date.fmt(DateTime).unwrap()
            )
        );
    }

    Ok(())
}

