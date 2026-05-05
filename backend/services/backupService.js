const mongoose = require('mongoose');
const Backup = require('../models/Backup');
const AppError = require('../utils/AppError');
const {
  buildDatabaseBackupKey,
  buildFileUrl,
  getObjectBuffer,
  uploadBuffer
} = require('./s3Service');

const createFileBackupRecord = async ({
  file,
  versionNumber,
  isLatest,
  fileSize,
  mimeType,
  category,
  originalName,
  uploadedAt
}) => Backup.create({
  backupType: 'file',
  userId: file.userId,
  fileId: file._id,
  fileName: file.fileName,
  originalName,
  s3Key: file.s3Key,
  s3Url: buildFileUrl(file.s3Key, file.s3VersionId),
  s3VersionId: file.s3VersionId,
  versionNumber,
  fileSize,
  mimeType,
  category: category || file.category || 'other',
  isLatest,
  metadata: {
    uploadedAt
  }
});

const markPreviousVersionsAsNotLatest = async (fileId) => {
  await Backup.updateMany(
    { fileId, backupType: 'file', isLatest: true },
    { $set: { isLatest: false } }
  );
};

const snapshotDatabase = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    databaseName: mongoose.connection.name,
    collections: {}
  };

  for (const collection of collections) {
    if (collection.name.startsWith('system.')) {
      continue;
    }

    const documents = await mongoose.connection.db.collection(collection.name).find({}).toArray();
    snapshot.collections[collection.name] = documents;
  }

  return Buffer.from(JSON.stringify(snapshot, null, 2), 'utf-8');
};

const createDatabaseBackup = async () => {
  if (!mongoose.connection?.db) {
    throw new AppError('MongoDB connection is not ready for backup', 500);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `mongo-backup-${timestamp}.json`;
  const backupBuffer = await snapshotDatabase();
  const s3Key = buildDatabaseBackupKey(fileName);
  const uploadResult = await uploadBuffer({
    key: s3Key,
    body: backupBuffer,
    contentType: 'application/json',
    metadata: {
      backupType: 'database',
      generatedAt: new Date().toISOString()
    }
  });

  await Backup.updateMany(
    { backupType: 'database', isLatest: true },
    { $set: { isLatest: false } }
  );

  return Backup.create({
    backupType: 'database',
    fileName,
    originalName: fileName,
    s3Key,
    s3Url: uploadResult.url,
    s3VersionId: uploadResult.versionId,
    versionNumber: 1,
    fileSize: backupBuffer.length,
    mimeType: 'application/json',
    category: 'database',
    isLatest: true,
    metadata: {
      databaseName: mongoose.connection.name
    }
  });
};

const restoreDatabaseBackup = async (backupId, mode = 'replace') => {
  const backup = await Backup.findOne({ _id: backupId, backupType: 'database' });
  if (!backup) {
    throw new AppError('Database backup not found', 404);
  }

  const backupBuffer = await getObjectBuffer({
    key: backup.s3Key,
    versionId: backup.s3VersionId
  });
  const parsedBackup = JSON.parse(backupBuffer.toString('utf-8'));
  const collectionEntries = Object.entries(parsedBackup.collections || {});

  for (const [collectionName, documents] of collectionEntries) {
    const collection = mongoose.connection.db.collection(collectionName);

    if (mode === 'replace') {
      await collection.deleteMany({});
    }

    if (Array.isArray(documents) && documents.length > 0) {
      if (mode === 'replace') {
        await collection.insertMany(documents, { ordered: false });
      } else {
        for (const document of documents) {
          const filter = document._id ? { _id: document._id } : document;
          await collection.replaceOne(filter, document, { upsert: true });
        }
      }
    }
  }

  return backup;
};

const restoreLatestDatabaseBackup = async (mode = 'replace') => {
  const latestBackup = await Backup.findOne({ backupType: 'database' }).sort({ createdAt: -1 });

  if (!latestBackup) {
    throw new AppError('No database backups available to restore', 404);
  }

  return restoreDatabaseBackup(latestBackup._id, mode);
};

const listAvailableBackups = async (userId = null, includeDatabaseBackups = true) => {
  const filters = userId
    ? includeDatabaseBackups
      ? {
          $or: [
            { backupType: 'database' },
            { backupType: 'file', userId }
          ]
        }
      : { backupType: 'file', userId }
    : {};

  return Backup.find(filters).sort({ createdAt: -1 });
};

module.exports = {
  createDatabaseBackup,
  createFileBackupRecord,
  listAvailableBackups,
  markPreviousVersionsAsNotLatest,
  restoreDatabaseBackup,
  restoreLatestDatabaseBackup
};
