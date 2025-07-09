# Alibaba Cloud OSS Bucket Lister

This Node.js script uses the AWS S3 SDK to list buckets in Alibaba Cloud OSS (Object Storage Service).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Alibaba Cloud credentials as environment variables:
   ```bash
   export ALIBABA_ACCESS_KEY_ID="your-access-key-id"
   export ALIBABA_SECRET_ACCESS_KEY="your-secret-access-key"
   export ALIBABA_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
   ```

   Replace the endpoint with your specific Alibaba Cloud region:
   - China (Hangzhou): `https://oss-cn-hangzhou.aliyuncs.com`
   - China (Shanghai): `https://oss-cn-shanghai.aliyuncs.com`
   - China (Beijing): `https://oss-cn-beijing.aliyuncs.com`
   - Singapore: `https://oss-ap-southeast-1.aliyuncs.com`
   - US (Silicon Valley): `https://oss-us-west-1.aliyuncs.com`

3. Run the script:
   ```bash
   npm start
   # or
   node list-alibaba-buckets.js
   ```

## How it Works

Alibaba Cloud OSS provides an S3-compatible API, which allows us to use the AWS SDK with a custom endpoint configuration. The script:

1. Configures the AWS S3 client with Alibaba Cloud OSS endpoint
2. Uses `forcePathStyle: true` for compatibility
3. Sends a ListBuckets command to retrieve all buckets
4. Displays bucket names and creation dates

## Requirements

- Node.js 14.0.0 or higher
- Valid Alibaba Cloud access credentials
- Network access to Alibaba Cloud OSS endpoints