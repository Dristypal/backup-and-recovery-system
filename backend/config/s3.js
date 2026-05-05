const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter((envKey) => !process.env[envKey]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required AWS environment variables: ${missingEnvVars.join(', ')}`);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim()
  }
});

module.exports = s3Client;
