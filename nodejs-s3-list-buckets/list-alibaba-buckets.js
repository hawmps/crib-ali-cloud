const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

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
};

// Create S3 client with Alibaba Cloud OSS configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  endpoint: config.endpoint,
  region: 'oss-cn-hangzhou', // This can be any value, as Alibaba OSS doesn't use AWS regions
  forcePathStyle: true, // Required for Alibaba Cloud OSS compatibility
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