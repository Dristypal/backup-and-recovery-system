const File = require('../models/File');
const Backup = require('../models/Backup');
const Log = require('../models/Log');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { getFileCategory } = require('../utils/fileCategory');
const {
  createFileBackupRecord,
  markPreviousVersionsAsNotLatest
} = require('../services/backupService');
const {
  buildUserFileKey,
  getObjectBuffer,
  getObjectStream,
  uploadBuffer
} = require('../services/s3Service');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload a file', 400);
  }

  const { id: userId } = req.user;
  const originalName = req.file.originalname.trim();
  const category = getFileCategory(req.file.mimetype, originalName);
  const s3Key = buildUserFileKey(userId, originalName);

  let file = await File.findOne({ userId, originalName });
  const nextVersion = file ? file.currentVersion + 1 : 1;

  if (file) {
    await markPreviousVersionsAsNotLatest(file._id);
  }

  const uploadResult = await uploadBuffer({
    key: s3Key,
    body: req.file.buffer,
    contentType: req.file.mimetype,
    metadata: {
      uploadedBy: String(userId),
      originalName
    }
  });

  if (!file) {
    file = await File.create({
      userId,
      fileName: originalName,
      originalName,
      filePath: s3Key,
      s3Key,
      s3VersionId: uploadResult.versionId,
      fileUrl: uploadResult.url,
      currentVersion: nextVersion,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      uploadedAt: new Date()
    });
  } else {
    file.fileName = originalName;
    file.filePath = s3Key;
    file.s3Key = s3Key;
    file.s3VersionId = uploadResult.versionId;
    file.fileUrl = uploadResult.url;
    file.currentVersion = nextVersion;
    file.fileSize = req.file.size;
    file.mimeType = req.file.mimetype;
    file.category = category;
    file.uploadedAt = new Date();
    await file.save();
  }

  const backupRecord = await createFileBackupRecord({
    file,
    versionNumber: nextVersion,
    isLatest: true,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    category,
    originalName,
    uploadedAt: file.uploadedAt
  });

  await Log.create({
    userId,
    action: 'upload',
    description: `Uploaded ${originalName} as version ${nextVersion}`,
    ipAddress: req.ip
  });

  return sendSuccess(
    res,
    file.currentVersion === 1 ? 201 : 200,
    file.currentVersion === 1 ? 'File uploaded successfully' : 'File version uploaded successfully',
    {
      file,
      backup: backupRecord
    }
  );
});

const getFiles = asyncHandler(async (req, res) => {
  const files = await File.find({ userId: req.user.id }).sort({ uploadedAt: -1 });

  return sendSuccess(res, 200, 'Files retrieved successfully', {
    count: files.length,
    files
  });
});

const getFileVersions = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (String(file.userId) !== req.user.id) {
    throw new AppError('Not authorized to view file versions', 403);
  }

  const versions = await Backup.find({
    fileId: file._id,
    backupType: 'file'
  }).sort({ versionNumber: -1 });

  return sendSuccess(res, 200, 'File versions retrieved successfully', {
    file,
    versions
  });
});

const downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (String(file.userId) !== req.user.id) {
    throw new AppError('Not authorized to access this file', 403);
  }

  const requestedVersion = req.query.versionId || file.s3VersionId;
  const s3Response = await getObjectStream({
    key: file.s3Key,
    versionId: requestedVersion
  });

  await Log.create({
    userId: req.user.id,
    action: 'download',
    description: `Downloaded ${file.originalName}${requestedVersion ? ` (version ${requestedVersion})` : ''}`,
    ipAddress: req.ip
  });

  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', s3Response.ContentType || file.mimeType || 'application/octet-stream');

  if (requestedVersion) {
    res.setHeader('x-s3-version-id', requestedVersion);
  }

  s3Response.Body.pipe(res);
});

const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (String(file.userId) !== req.user.id) {
    throw new AppError('Not authorized to delete this file', 403);
  }

  await Backup.updateMany(
    { fileId: file._id, backupType: 'file' },
    { $set: { isLatest: false } }
  );
  await File.findByIdAndDelete(file._id);

  await Log.create({
    userId: req.user.id,
    action: 'delete',
    description: `Deleted metadata for ${file.originalName}`,
    ipAddress: req.ip
  });

  return sendSuccess(res, 200, 'File metadata deleted successfully');
});

const restoreFileVersion = asyncHandler(async (req, res) => {
  const backup = await Backup.findOne({
    _id: req.params.backupId,
    backupType: 'file'
  });

  if (!backup) {
    throw new AppError('Backup version not found', 404);
  }

  const file = await File.findById(backup.fileId);
  if (!file) {
    throw new AppError('Linked file not found', 404);
  }

  if (String(file.userId) !== req.user.id) {
    throw new AppError('Not authorized to restore this file', 403);
  }

  const buffer = await getObjectBuffer({
    key: backup.s3Key,
    versionId: backup.s3VersionId
  });

  await markPreviousVersionsAsNotLatest(file._id);

  const restoredUpload = await uploadBuffer({
    key: file.s3Key,
    body: buffer,
    contentType: backup.mimeType,
    metadata: {
      restoredFromVersion: String(backup.versionNumber),
      originalName: backup.originalName
    }
  });

  file.s3VersionId = restoredUpload.versionId;
  file.fileUrl = restoredUpload.url;
  file.fileSize = backup.fileSize;
  file.mimeType = backup.mimeType;
  file.currentVersion += 1;
  file.uploadedAt = new Date();
  await file.save();

  const restoredBackup = await createFileBackupRecord({
    file,
    versionNumber: file.currentVersion,
    isLatest: true,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    category: file.category,
    originalName: file.originalName,
    uploadedAt: file.uploadedAt
  });

  await Log.create({
    userId: req.user.id,
    action: 'restore',
    description: `Restored ${file.originalName} from version ${backup.versionNumber}`,
    ipAddress: req.ip
  });

  return sendSuccess(res, 200, 'File restored successfully', {
    file,
    restoredBackup
  });
});

module.exports = {
  deleteFile,
  downloadFile,
  getFiles,
  getFileVersions,
  restoreFileVersion,
  uploadFile
};
