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

## SSL Certificate Issues on Windows

Node.js doesn't use the Windows certificate store by default. If you encounter a "self-signed certificate in certificate chain" error, you have several options:

### Option 1: Export Certificate from Windows (Recommended)
1. Export the certificate from Windows Certificate Store to a .pem file
2. Set the environment variable: `set NODE_EXTRA_CA_CERTS=path\to\certificate.pem`
3. Run the script normally

### Option 2: Disable SSL Validation (Temporary/Development)
```cmd
set ALIBABA_DISABLE_SSL=true
node list-alibaba-buckets.js
```

### Option 3: Global Node.js Setting (Not Recommended)
```cmd
set NODE_TLS_REJECT_UNAUTHORIZED=0
node list-alibaba-buckets.js
```
**Warning**: This disables SSL validation globally for all Node.js connections and should not be used in production.