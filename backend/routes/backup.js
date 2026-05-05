const express = require('express');
const {
  downloadBackup,
  listBackups,
  restoreDatabaseBackupById,
  restoreLatestBackup,
  triggerDatabaseBackup
} = require('../controllers/backupController');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listBackups);
router.post('/database', protect, authorize('admin'), triggerDatabaseBackup);
router.get('/:backupId/download', protect, downloadBackup);
router.post('/:backupId/restore', protect, authorize('admin'), restoreDatabaseBackupById);
router.post('/restore-latest', protect, authorize('admin'), restoreLatestBackup);

module.exports = router;
