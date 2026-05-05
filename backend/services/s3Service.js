const {
  GetBucketVersioningCommand,
  GetObjectCommand,
  PutBucketVersioningCommand,
  PutObjectCommand
} = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const AppError = require('../utils/AppError');

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;

const buildFileUrl = (key, versionId) => {
  const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

  return versionId ? `${baseUrl}?versionId=${encodeURIComponent(versionId)}` : baseUrl;
};

const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const buildUserFileKey = (userId, originalName) => `users/${userId}/files/${sanitizeFileName(originalName)}`;

const buildDatabaseBackupKey = (fileName) => `system-backups/${fileName}`;

const uploadBuffer = async ({ key, body, contentType, metadata = {} }) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata
  });

  const response = await s3Client.send(command);

  return {
    key,
    versionId: response.VersionId || null,
    url: buildFileUrl(key, response.VersionId || null),
    etag: response.ETag || null
  };
};

const getObjectStream = async ({ key, versionId = null }) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      VersionId: versionId || undefined
    });

    return await s3Client.send(command);
  } catch (error) {
    throw new AppError('Unable to fetch the requested object from S3', 404, error.message);
  }
};

const getObjectBuffer = async ({ key, versionId = null }) => {
  const response = await getObjectStream({ key, versionId });

  if (!response.Body) {
    throw new AppError('S3 returned an empty response body', 500);
  }

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

const ensureBucketVersioningEnabled = async () => {
  const statusResponse = await s3Client.send(new GetBucketVersioningCommand({
    Bucket: bucketName
  }));

  if (statusResponse.Status === 'Enabled') {
    return { enabled: true, changed: false };
  }

  await s3Client.send(new PutBucketVersioningCommand({
    Bucket: bucketName,
    VersioningConfiguration: {
      Status: 'Enabled'
    }
  }));

  return { enabled: true, changed: true };
};

module.exports = {
  buildDatabaseBackupKey,
  buildFileUrl,
  buildUserFileKey,
  ensureBucketVersioningEnabled,
  getObjectBuffer,
  getObjectStream,
  sanitizeFileName,
  uploadBuffer
};
