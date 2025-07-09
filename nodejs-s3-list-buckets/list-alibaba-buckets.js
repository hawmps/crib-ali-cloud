const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const https = require('https');

// Configuration for Alibaba Cloud OSS
const config = {
  // Replace with your Alibaba Cloud credentials
  accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: process.env.ALIBABA_SECRET_ACCESS_KEY || 'YOUR_SECRET_ACCESS_KEY',
  
  // Replace with your Alibaba Cloud OSS region endpoint
  // Format: oss-[region].aliyuncs.com
  // Examples:
  // - oss-cn-hangzhou.aliyuncs.com (China - Hangzhou)
  // - oss-cn-shanghai.aliyuncs.com (China - Shanghai)
  // - oss-cn-beijing.aliyuncs.com (China - Beijing)
  // - oss-ap-southeast-1.aliyuncs.com (Singapore)
  // - oss-us-west-1.aliyuncs.com (US - Silicon Valley)
  endpoint: process.env.ALIBABA_OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
  
  // SSL/TLS configuration
  // Set NODE_TLS_REJECT_UNAUTHORIZED=0 to disable certificate validation (NOT recommended for production)
  // Or set ALIBABA_DISABLE_SSL=true to disable SSL validation for this script only
  disableSSL: process.env.ALIBABA_DISABLE_SSL === 'true',
};

// Create HTTPS agent with custom options
const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.disableSSL, // Disable certificate validation if configured
});

// Create S3 client with Alibaba Cloud OSS configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  endpoint: config.endpoint,
  region: 'oss-cn-hangzhou', // This can be any value, as Alibaba OSS doesn't use AWS regions
  forcePathStyle: true, // Required for Alibaba Cloud OSS compatibility
  requestHandler: {
    httpsAgent: httpsAgent,
  },
});

async function listBuckets() {
  try {
    console.log('Connecting to Alibaba Cloud OSS...');
    console.log(`Endpoint: ${config.endpoint}`);
    
    // Create and send the ListBuckets command
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    // Check if buckets exist
    if (!response.Buckets || response.Buckets.length === 0) {
      console.log('\nNo buckets found in this Alibaba Cloud account.');
      return;
    }
    
    // Display bucket information
    console.log(`\nFound ${response.Buckets.length} bucket(s):\n`);
    
    response.Buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. Bucket Name: ${bucket.Name}`);
      if (bucket.CreationDate) {
        console.log(`   Created: ${bucket.CreationDate.toLocaleString()}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error listing buckets:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.error('\nPlease check your credentials:');
      console.error('- Set ALIBABA_ACCESS_KEY_ID environment variable');
      console.error('- Set ALIBABA_SECRET_ACCESS_KEY environment variable');
    } else if (error.name === 'EndpointError' || error.name === 'NetworkingError') {
      console.error('\nPlease check your endpoint configuration:');
      console.error('- Ensure the endpoint URL is correct for your Alibaba Cloud region');
      console.error('- Check your internet connection');
    } else if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('\nSSL Certificate Error:');
      console.error('This appears to be a self-signed certificate issue.');
      console.error('\nTo resolve this on Windows:');
      console.error('1. (Recommended) Export the certificate from Windows Certificate Store and use NODE_EXTRA_CA_CERTS');
      console.error('2. (Temporary) Set environment variable: ALIBABA_DISABLE_SSL=true');
      console.error('3. (Not recommended) Set NODE_TLS_REJECT_UNAUTHORIZED=0');
      console.error('\nExample: set ALIBABA_DISABLE_SSL=true && node list-alibaba-buckets.js');
    }
  }
}

// Run the script
console.log('Alibaba Cloud OSS Bucket Lister');
console.log('================================\n');

listBuckets().then(() => {
  console.log('\nOperation completed.');
}).catch((error) => {
  console.error('\nUnexpected error:', error);
  process.exit(1);
});