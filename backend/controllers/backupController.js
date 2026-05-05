const Backup = require('../models/Backup');
const Log = require('../models/Log');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const {
  createDatabaseBackup,
  listAvailableBackups,
  restoreDatabaseBackup,
  restoreLatestDatabaseBackup
} = require('../services/backupService');
const { getObjectStream } = require('../services/s3Service');

const listBackups = asyncHandler(async (req, res) => {
  const backups = await listAvailableBackups(req.user.id, req.user.role === 'admin');

  return sendSuccess(res, 200, 'Backups retrieved successfully', {
    count: backups.length,
    backups
  });
});

const triggerDatabaseBackup = asyncHandler(async (req, res) => {
  const backup = await createDatabaseBackup();

  await Log.create({
    userId: req.user.id,
    action: 'backup',
    description: `Triggered database backup ${backup.fileName}`,
    ipAddress: req.ip
  });

  return sendSuccess(res, 201, 'Database backup created successfully', { backup });
});

const downloadBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.backupId);
  if (!backup) {
    throw new AppError('Backup not found', 404);
  }

  if (backup.backupType === 'file' && String(backup.userId) !== req.user.id) {
    throw new AppError('Not authorized to access this backup', 403);
  }

  if (backup.backupType === 'database' && req.user.role !== 'admin') {
    throw new AppError('Not authorized to access database backups', 403);
  }

  const s3Response = await getObjectStream({
    key: backup.s3Key,
    versionId: backup.s3VersionId
  });

  await Log.create({
    userId: req.user.id,
    action: 'download',
    description: `Downloaded backup ${backup.fileName}`,
    ipAddress: req.ip
  });

  res.setHeader('Content-Disposition', `attachment; filename="${backup.originalName}"`);
  res.setHeader('Content-Type', s3Response.ContentType || backup.mimeType || 'application/octet-stream');

  s3Response.Body.pipe(res);
});

const restoreDatabaseBackupById = asyncHandler(async (req, res) => {
  const mode = req.body.mode === 'merge' ? 'merge' : 'replace';
  const backup = await restoreDatabaseBackup(req.params.backupId, mode);

  await Log.create({
    userId: req.user.id,
    action: 'restore',
    description: `Restored database backup ${backup.fileName} using ${mode} mode`,
    ipAddress: req.ip
  });

  return sendSuccess(res, 200, 'Database backup restored successfully', {
    backup,
    mode
  });
});

const restoreLatestBackup = asyncHandler(async (req, res) => {
  const mode = req.body.mode === 'merge' ? 'merge' : 'replace';
  const backup = await restoreLatestDatabaseBackup(mode);

  await Log.create({
    userId: req.user.id,
    action: 'restore',
    description: `Restored latest database backup ${backup.fileName} using ${mode} mode`,
    ipAddress: req.ip
  });

  return sendSuccess(res, 200, 'Latest database backup restored successfully', {
    backup,
    mode
  });
});

module.exports = {
  downloadBackup,
  listBackups,
  restoreDatabaseBackupById,
  restoreLatestBackup,
  triggerDatabaseBackup
};
