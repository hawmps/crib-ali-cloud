const { S3Client, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const readline = require('readline');

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
// Alibaba Cloud OSS uses virtual hosted-style URLs: <bucket>.<endpoint>/<object>
const s3Client = new S3Client({
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  endpoint: config.endpoint,
  region: 'oss-cn-hangzhou', // This can be any value, as Alibaba OSS doesn't use AWS regions
  forcePathStyle: false, // Use virtual hosted-style URLs for Alibaba Cloud OSS
  requestHandler: {
    httpsAgent: httpsAgent,
  },
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Read the first N lines of an object
async function readObjectLines(bucketName, objectKey, numLines = 10) {
  try {
    console.log(`\nReading first ${numLines} lines from: ${objectKey}`);
    console.log('-'.repeat(80));
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    const response = await s3Client.send(command);
    
    // Convert stream to string
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      });
    
    const bodyContents = await streamToString(response.Body);
    
    // Split into lines and get first N lines
    const lines = bodyContents.split('\n');
    const linesToShow = lines.slice(0, numLines);
    
    // Display the lines with line numbers
    linesToShow.forEach((line, index) => {
      console.log(`${(index + 1).toString().padStart(4)}: ${line}`);
    });
    
    if (lines.length > numLines) {
      console.log(`\n... (${lines.length - numLines} more lines)`);
    }
    
    console.log('-'.repeat(80));
    console.log(`Total lines in file: ${lines.length}`);
    
  } catch (error) {
    console.error('\nError reading object:', error.message);
    
    if (error.name === 'NoSuchKey') {
      console.error('The specified object does not exist.');
    } else if (error.name === 'AccessDenied') {
      console.error('Access denied. Check your permissions for this object.');
    }
  }
}

// List objects in a specific bucket for the last 7 days
async function listRecentObjects(bucketName) {
  try {
    console.log(`\nFetching objects from bucket: ${bucketName}`);
    console.log('Filtering for objects modified in the last 7 days...\n');
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let continuationToken = undefined;
    let totalObjects = 0;
    let recentObjects = [];
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });
      
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        // Filter objects modified in the last 7 days
        const filtered = response.Contents.filter(obj => 
          obj.LastModified && new Date(obj.LastModified) >= sevenDaysAgo
        );
        recentObjects = recentObjects.concat(filtered);
        totalObjects += response.Contents.length;
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    if (recentObjects.length === 0) {
      console.log('No objects found that were modified in the last 7 days.');
      return;
    }
    
    // Sort by last modified date (newest first)
    recentObjects.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    
    console.log(`Found ${recentObjects.length} object(s) modified in the last 7 days:\n`);
    console.log('Last Modified'.padEnd(25) + 'Size'.padEnd(15) + 'Key');
    console.log('-'.repeat(80));
    
    recentObjects.forEach(obj => {
      const lastModified = obj.LastModified ? new Date(obj.LastModified).toLocaleString() : 'Unknown';
      const size = formatFileSize(obj.Size || 0);
      console.log(
        lastModified.padEnd(25) +
        size.padEnd(15) +
        obj.Key
      );
    });
    
    console.log(`\nTotal objects scanned: ${totalObjects}`);
    console.log(`Objects from last 7 days: ${recentObjects.length}`);
    
    return { bucketName, objects: recentObjects };
    
  } catch (error) {
    console.error('\nError listing objects:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.error('The specified bucket does not exist.');
    } else if (error.name === 'AccessDenied') {
      console.error('Access denied. Check your permissions for this bucket.');
    }
    return null;
  }
}

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
      return null;
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
    
    return response.Buckets;
    
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
    return null;
  }
}

// Main function
async function main() {
  console.log('Alibaba Cloud OSS Bucket Explorer');
  console.log('=================================\n');
  
  // List buckets
  const buckets = await listBuckets();
  
  if (!buckets || buckets.length === 0) {
    rl.close();
    return;
  }
  
  // Ask user to select a bucket
  rl.question('\nEnter the number of the bucket to explore (or "q" to quit): ', async (answer) => {
    if (answer.toLowerCase() === 'q') {
      console.log('\nExiting...');
      rl.close();
      return;
    }
    
    const bucketIndex = parseInt(answer) - 1;
    
    if (isNaN(bucketIndex) || bucketIndex < 0 || bucketIndex >= buckets.length) {
      console.log('\nInvalid selection. Please run the script again.');
      rl.close();
      return;
    }
    
    const selectedBucket = buckets[bucketIndex];
    const result = await listRecentObjects(selectedBucket.Name);
    
    if (result && result.objects.length > 0) {
      // Ask if user wants to read any object
      rl.question('\nWould you like to read the contents of any file? (y/n): ', async (readAnswer) => {
        if (readAnswer.toLowerCase() === 'y') {
          // Display objects with indices
          console.log('\nSelect a file to read:');
          result.objects.forEach((obj, index) => {
            console.log(`${index + 1}. ${obj.Key}`);
          });
          
          rl.question('\nEnter the file number (or "q" to quit): ', async (fileAnswer) => {
            if (fileAnswer.toLowerCase() === 'q') {
              rl.close();
              return;
            }
            
            const fileIndex = parseInt(fileAnswer) - 1;
            if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= result.objects.length) {
              console.log('\nInvalid selection.');
              rl.close();
              return;
            }
            
            const selectedObject = result.objects[fileIndex];
            
            // Ask how many lines to read
            rl.question('\nHow many lines to read? (default: 10): ', async (linesAnswer) => {
              const numLines = parseInt(linesAnswer) || 10;
              await readObjectLines(result.bucketName, selectedObject.Key, numLines);
              rl.close();
            });
          });
        } else {
          rl.close();
        }
      });
    } else {
      rl.close();
    }
  });
}

// Run the script
main().catch((error) => {
  console.error('\nUnexpected error:', error);
  rl.close();
  process.exit(1);
});