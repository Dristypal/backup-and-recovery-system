const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const requiredEnvVars = ['AWS_REGION', 'AWS_S3_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter((envKey) => !process.env[envKey]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required AWS environment variables: ${missingEnvVars.join(', ')}`);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION
});

module.exports = s3Client;
